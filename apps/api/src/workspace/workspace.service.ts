import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  InvitationStatus,
  MembershipRole,
  MembershipStatus,
  type Prisma,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { throwWorkspaceLimitReached } from './workspace.errors';
import { WORKSPACE_MAX_SEATS } from './workspace.constants';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async listWorkspaces(userId: string) {
    const rows = await this.prisma.membership.findMany({
      where: {
        userId,
        status: MembershipStatus.active,
      },
      include: { workspace: true },
      orderBy: { createdAt: 'asc' },
    });
    return {
      items: rows.map((r) => ({
        id: r.workspace.id,
        name: r.workspace.name,
        createdAt: r.workspace.createdAt,
        role: r.role,
      })),
    };
  }

  async createWorkspace(userId: string, name: string) {
    const trimmed = name.trim();
    return this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: {
          name: trimmed,
          createdByUserId: userId,
        },
      });
      await tx.membership.create({
        data: {
          workspaceId: ws.id,
          userId,
          role: MembershipRole.admin,
          status: MembershipStatus.active,
          joinedAt: new Date(),
        },
      });
      return {
        id: ws.id,
        name: ws.name,
        createdAt: ws.createdAt,
        updatedAt: ws.updatedAt,
      };
    });
  }

  async listMembers(workspaceId: string) {
    const rows = await this.prisma.membership.findMany({
      where: {
        workspaceId,
        status: { in: [MembershipStatus.active, MembershipStatus.invited] },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return {
      items: rows.map((m) => ({
        userId: m.userId,
        email: m.user.email,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        status: m.status,
        joinedAt: m.joinedAt,
      })),
    };
  }

  async createInvitation(
    workspaceId: string,
    invitedByUserId: string,
    rawEmail: string,
  ) {
    const email = rawEmail.trim().toLowerCase();
    return this.prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.findUnique({
        where: { id: workspaceId },
      });
      if (!workspace) {
        throw new NotFoundException({
          code: 'WORKSPACE_NOT_FOUND',
          message: 'Workspace not found.',
        });
      }

      const inviter = await tx.user.findUnique({ where: { id: invitedByUserId } });
      if (!inviter || inviter.email.toLowerCase() === email) {
        throw new ConflictException({
          code: 'VALIDATION_ERROR',
          message: 'You cannot invite your own email address.',
        });
      }

      const existingMember = await tx.membership.findFirst({
        where: {
          workspaceId,
          status: MembershipStatus.active,
          user: { email },
        },
      });
      if (existingMember) {
        throw new ConflictException({
          code: 'ALREADY_MEMBER',
          message: 'This user is already an active member of the workspace.',
        });
      }

      const pendingSameEmail = await tx.invitation.findFirst({
        where: {
          workspaceId,
          email,
          status: InvitationStatus.pending,
        },
      });
      if (pendingSameEmail) {
        throw new ConflictException({
          code: 'INVITE_PENDING',
          message: 'An invitation is already pending for this email.',
        });
      }

      const seats = await this.countSeats(tx, workspaceId);
      if (seats >= WORKSPACE_MAX_SEATS) {
        throwWorkspaceLimitReached();
      }

      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const invitation = await tx.invitation.create({
        data: {
          workspaceId,
          email,
          token,
          invitedByUserId,
          status: InvitationStatus.pending,
          expiresAt,
        },
      });

      return {
        id: invitation.id,
        workspaceId: invitation.workspaceId,
        email: invitation.email,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        token,
        inviteLink: this.buildInviteLink(token),
      };
    });
  }

  async acceptInvitation(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found.' });
    }

    return this.prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { token },
      });
      if (!invitation || invitation.status !== InvitationStatus.pending) {
        throw new NotFoundException({
          code: 'INVITATION_NOT_FOUND',
          message: 'Invitation is invalid or no longer pending.',
        });
      }
      if (invitation.expiresAt.getTime() < Date.now()) {
        throw new ConflictException({
          code: 'INVITATION_EXPIRED',
          message: 'This invitation has expired.',
        });
      }
      if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
        throw new ForbiddenException({
          code: 'FORBIDDEN',
          message: 'This invitation was sent to a different email address.',
        });
      }

      const existing = await tx.membership.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId,
          },
        },
      });
      if (existing?.status === MembershipStatus.active) {
        throw new ConflictException({
          code: 'ALREADY_MEMBER',
          message: 'You are already a member of this workspace.',
        });
      }

      const seats = await this.countSeats(tx, invitation.workspaceId);
      if (seats >= WORKSPACE_MAX_SEATS) {
        throwWorkspaceLimitReached();
      }

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: InvitationStatus.accepted,
          acceptedAt: new Date(),
        },
      });

      const membership = await tx.membership.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: invitation.workspaceId,
            userId,
          },
        },
        create: {
          workspaceId: invitation.workspaceId,
          userId,
          role: MembershipRole.member,
          status: MembershipStatus.active,
          joinedAt: new Date(),
        },
        update: {
          role: MembershipRole.member,
          status: MembershipStatus.active,
          joinedAt: new Date(),
        },
      });

      const workspace = await tx.workspace.findUniqueOrThrow({
        where: { id: invitation.workspaceId },
      });

      return {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          createdAt: workspace.createdAt,
        },
        membership: {
          role: membership.role,
          status: membership.status,
        },
      };
    });
  }

  private buildInviteLink(token: string): string {
    const base =
      process.env.PUBLIC_WEB_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
    return `${base}/invitations/accept?token=${encodeURIComponent(token)}`;
  }

  private async countSeats(db: DbClient, workspaceId: string): Promise<number> {
    const [activeMembers, pendingInvites] = await Promise.all([
      db.membership.count({
        where: { workspaceId, status: MembershipStatus.active },
      }),
      db.invitation.count({
        where: { workspaceId, status: InvitationStatus.pending },
      }),
    ]);
    return activeMembers + pendingInvites;
  }
}
