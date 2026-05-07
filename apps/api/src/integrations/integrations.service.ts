import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MembershipStatus, Prisma, TaskSuggestionStatus } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { TaskService } from '../task/task.service';
import type { ApproveTaskSuggestionDto } from './dto/approve-task-suggestion.dto';
import type { CreateAgentIngestTokenDto } from './dto/create-agent-ingest-token.dto';
import type { IngestTaskSuggestionDto } from './dto/ingest-task-suggestion.dto';
import type { ListTaskSuggestionsQueryDto } from './dto/list-task-suggestions-query.dto';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly taskService: TaskService,
  ) {}

  private hashToken(rawToken: string) {
    const pepper = this.config.get<string>('AGENT_INGEST_PEPPER', '');
    return createHash('sha256').update(`${pepper}:${rawToken}`).digest('hex');
  }

  private mapTokenRow(row: {
    id: string;
    label: string | null;
    createdAt: Date;
    lastUsedAt: Date | null;
    revokedAt: Date | null;
  }) {
    return {
      id: row.id,
      label: row.label,
      createdAt: row.createdAt.toISOString(),
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      revokedAt: row.revokedAt?.toISOString() ?? null,
    };
  }

  private mapSuggestionRow(
    row: {
      id: string;
      userId: string;
      status: TaskSuggestionStatus;
      title: string;
      description: string | null;
      source: unknown;
      dedupeKey: string;
      proposedWorkspaceId: string | null;
      proposedAssigneeUserId: string | null;
      proposedPriority: string | null;
      proposedDueAt: Date | null;
      routingNotes: string | null;
      routingConfidence: number | null;
      resolvedTaskId: string | null;
      createdAt: Date;
      updatedAt: Date;
      resolvedAt: Date | null;
    },
  ) {
    return {
      id: row.id,
      userId: row.userId,
      status: row.status,
      title: row.title,
      description: row.description,
      source:
        row.source && typeof row.source === 'object'
          ? (row.source as Record<string, unknown>)
          : {},
      dedupeKey: row.dedupeKey,
      proposedWorkspaceId: row.proposedWorkspaceId,
      proposedAssigneeUserId: row.proposedAssigneeUserId,
      proposedPriority: row.proposedPriority,
      proposedDueAt: row.proposedDueAt?.toISOString() ?? null,
      routingNotes: row.routingNotes,
      routingConfidence: row.routingConfidence,
      resolvedTaskId: row.resolvedTaskId,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      resolvedAt: row.resolvedAt?.toISOString() ?? null,
    };
  }

  async createAgentIngestToken(userId: string, dto: CreateAgentIngestTokenDto) {
    const plaintextToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(plaintextToken);
    const row = await this.prisma.agentIngestToken.create({
      data: {
        userId,
        tokenHash,
        label: dto.label?.trim() || null,
      },
    });
    return {
      token: plaintextToken,
      item: this.mapTokenRow(row),
    };
  }

  async listAgentIngestTokens(userId: string) {
    const rows = await this.prisma.agentIngestToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return { items: rows.map((row) => this.mapTokenRow(row)) };
  }

  async revokeAgentIngestToken(userId: string, tokenId: string) {
    const existing = await this.prisma.agentIngestToken.findFirst({
      where: { id: tokenId, userId },
    });
    if (!existing) {
      throw new NotFoundException({
        code: 'TOKEN_NOT_FOUND',
        message: 'Agent ingest token not found.',
      });
    }
    const row = await this.prisma.agentIngestToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });
    return this.mapTokenRow(row);
  }

  async ingestTaskSuggestion(rawToken: string, dto: IngestTaskSuggestionDto) {
    const token = rawToken.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Missing ingest token.',
      });
    }

    const tokenHash = this.hashToken(token);
    const agentToken = await this.prisma.agentIngestToken.findFirst({
      where: { tokenHash, revokedAt: null },
    });
    if (!agentToken) {
      throw new UnauthorizedException({
        code: 'UNAUTHORIZED',
        message: 'Invalid ingest token.',
      });
    }

    const dedupeBase =
      dto.source?.messageId ||
      `${dto.title}:${dto.description || ''}:${dto.source?.subject || ''}:${dto.source?.from || ''}`;
    const dedupeKey = createHash('sha256').update(dedupeBase).digest('hex');

    const existing = await this.prisma.taskSuggestion.findFirst({
      where: {
        userId: agentToken.userId,
        dedupeKey,
      },
    });
    if (existing) {
      return {
        duplicate: true,
        item: this.mapSuggestionRow(existing),
      };
    }

    const row = await this.prisma.$transaction(async (tx) => {
      await tx.agentIngestToken.update({
        where: { id: agentToken.id },
        data: { lastUsedAt: new Date() },
      });
      const memberships = await tx.membership.findMany({
        where: {
          userId: agentToken.userId,
          status: MembershipStatus.active,
        },
        select: { workspaceId: true },
      });
      const proposedWorkspaceId =
        memberships.length === 1 ? memberships[0].workspaceId : null;
      return tx.taskSuggestion.create({
        data: {
          userId: agentToken.userId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          source: (dto.source ?? {}) as Prisma.InputJsonValue,
          dedupeKey,
          proposedWorkspaceId,
          proposedAssigneeUserId: agentToken.userId,
          proposedPriority: 'medium',
          routingNotes: proposedWorkspaceId
            ? 'Auto-routed to your only active workspace.'
            : null,
          routingConfidence: proposedWorkspaceId ? 0.6 : null,
        },
      });
    });

    return {
      duplicate: false,
      item: this.mapSuggestionRow(row),
    };
  }

  async listTaskSuggestions(
    userId: string,
    query: ListTaskSuggestionsQueryDto,
  ) {
    const rows = await this.prisma.taskSuggestion.findMany({
      where: {
        userId,
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return { items: rows.map((row) => this.mapSuggestionRow(row)) };
  }

  async getTaskSuggestion(userId: string, suggestionId: string) {
    const row = await this.prisma.taskSuggestion.findFirst({
      where: { id: suggestionId, userId },
    });
    if (!row) {
      throw new NotFoundException({
        code: 'SUGGESTION_NOT_FOUND',
        message: 'Task suggestion not found.',
      });
    }
    return this.mapSuggestionRow(row);
  }

  async createTestTaskSuggestion(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        userId,
        status: MembershipStatus.active,
      },
      select: {
        workspaceId: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    const proposedWorkspaceId =
      memberships.length > 0 ? memberships[0].workspaceId : null;

    const sourceMessageId = `test-${Date.now()}`;
    const row = await this.prisma.taskSuggestion.create({
      data: {
        userId,
        title: 'Test ingest suggestion',
        description:
          'This suggestion was created from the dashboard test-ingest action.',
        source: {
          messageId: sourceMessageId,
          threadId: 'dashboard-test',
          from: 'taskbridge-test@example.com',
          subject: 'Dashboard test suggestion',
          bodyPreview:
            'Use this sample to validate review-and-approve flow end to end.',
          receivedAt: new Date().toISOString(),
        },
        dedupeKey: createHash('sha256').update(sourceMessageId).digest('hex'),
        proposedWorkspaceId,
        proposedAssigneeUserId: userId,
        proposedPriority: 'medium',
        routingNotes: 'Created via dashboard smoke test action.',
        routingConfidence: 1,
      },
    });

    return this.mapSuggestionRow(row);
  }

  async approveTaskSuggestion(
    userId: string,
    suggestionId: string,
    dto: ApproveTaskSuggestionDto,
  ) {
    const suggestion = await this.prisma.taskSuggestion.findFirst({
      where: { id: suggestionId, userId },
    });
    if (!suggestion) {
      throw new NotFoundException({
        code: 'SUGGESTION_NOT_FOUND',
        message: 'Task suggestion not found.',
      });
    }
    if (suggestion.status !== TaskSuggestionStatus.pending) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Only pending suggestions can be approved.',
      });
    }

    const workspaceMembership = await this.prisma.membership.findFirst({
      where: {
        workspaceId: dto.workspaceId,
        userId,
        status: MembershipStatus.active,
      },
    });
    if (!workspaceMembership) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'You must be an active member of the selected workspace.',
      });
    }

    const task = await this.taskService.createTask(dto.workspaceId, userId, {
      title: dto.title?.trim() || suggestion.title,
      description:
        dto.description !== undefined
          ? dto.description?.trim() || undefined
          : suggestion.description || undefined,
      assigneeUserId: dto.assigneeUserId,
      priority: dto.priority,
      dueAt: dto.dueAt,
    });

    const row = await this.prisma.taskSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: TaskSuggestionStatus.approved,
        resolvedTaskId: task.id,
        proposedWorkspaceId: dto.workspaceId,
        proposedAssigneeUserId: dto.assigneeUserId,
        proposedPriority: dto.priority,
        proposedDueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        resolvedAt: new Date(),
        routingNotes: 'Approved by user.',
      },
    });

    return {
      item: this.mapSuggestionRow(row),
      task,
    };
  }

  async rejectTaskSuggestion(userId: string, suggestionId: string, reason?: string) {
    const suggestion = await this.prisma.taskSuggestion.findFirst({
      where: { id: suggestionId, userId },
    });
    if (!suggestion) {
      throw new NotFoundException({
        code: 'SUGGESTION_NOT_FOUND',
        message: 'Task suggestion not found.',
      });
    }
    if (suggestion.status !== TaskSuggestionStatus.pending) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Only pending suggestions can be rejected.',
      });
    }

    const row = await this.prisma.taskSuggestion.update({
      where: { id: suggestion.id },
      data: {
        status: TaskSuggestionStatus.rejected,
        resolvedAt: new Date(),
        routingNotes: reason?.trim() || null,
      },
    });
    return this.mapSuggestionRow(row);
  }
}
