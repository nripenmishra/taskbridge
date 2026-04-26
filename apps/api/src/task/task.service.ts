import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  MembershipRole,
  MembershipStatus,
  Prisma,
  Task,
  TaskActivityEventType,
  TaskStatus,
  type TaskActivity,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertStatusTransition } from './task-status.policy';
import type { ChangeTaskStatusDto } from './dto/change-task-status.dto';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  private toTaskResponse(task: Task) {
    return {
      id: task.id,
      workspaceId: task.workspaceId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt?.toISOString() ?? null,
      assigneeUserId: task.assigneeUserId,
      creatorUserId: task.creatorUserId,
      cancelReason: task.cancelReason,
      completedAt: task.completedAt?.toISOString() ?? null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    };
  }

  private toActivityResponse(row: TaskActivity) {
    return {
      id: row.id,
      taskId: row.taskId,
      actorUserId: row.actorUserId,
      eventType: row.eventType,
      meta:
        row.meta === null || typeof row.meta !== 'object'
          ? {}
          : (row.meta as Record<string, unknown>),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async requireTaskInWorkspace(
    workspaceId: string,
    taskId: string,
  ): Promise<Task> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });
    if (!task) {
      throw new NotFoundException({
        code: 'TASK_NOT_FOUND',
        message: 'Task not found.',
      });
    }
    return task;
  }

  private async assertActiveAssignee(
    workspaceId: string,
    assigneeUserId: string,
  ): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: {
        workspaceId,
        userId: assigneeUserId,
        status: MembershipStatus.active,
      },
    });
    if (!m) {
      throw new UnprocessableEntityException({
        code: 'VALIDATION_ERROR',
        message: 'Assignee must be an active member of this workspace.',
      });
    }
  }

  private canEditFields(
    userId: string,
    task: Task,
    role: MembershipRole,
  ): boolean {
    return (
      userId === task.creatorUserId || role === MembershipRole.admin
    );
  }

  async createTask(
    workspaceId: string,
    creatorUserId: string,
    dto: CreateTaskDto,
  ) {
    await this.assertActiveAssignee(workspaceId, dto.assigneeUserId);

    const task = await this.prisma.$transaction(async (tx) => {
      const t = await tx.task.create({
        data: {
          workspaceId,
          title: dto.title.trim(),
          description: dto.description?.trim() ?? null,
          priority: dto.priority,
          status: TaskStatus.open,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
          assigneeUserId: dto.assigneeUserId,
          creatorUserId,
        },
      });
      await tx.taskActivity.create({
        data: {
          workspaceId,
          taskId: t.id,
          actorUserId: creatorUserId,
          eventType: TaskActivityEventType.created,
          meta: {
            title: t.title,
            assigneeUserId: t.assigneeUserId,
            priority: t.priority,
          },
        },
      });
      return t;
    });

    return this.toTaskResponse(task);
  }

  async getTask(workspaceId: string, taskId: string) {
    const task = await this.requireTaskInWorkspace(workspaceId, taskId);
    return this.toTaskResponse(task);
  }

  async listTasks(
    workspaceId: string,
    userId: string,
    query: ListTasksQueryDto,
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TaskWhereInput = { workspaceId };
    const view = query.view ?? 'all';

    if (view === 'assigned_to_me') {
      where.assigneeUserId = userId;
      if (query.status === undefined) {
        where.status = {
          in: [
            TaskStatus.open,
            TaskStatus.in_progress,
            TaskStatus.completed,
          ],
        };
      }
    } else if (view === 'assigned_by_me') {
      where.creatorUserId = userId;
      if (query.status === undefined) {
        where.status = {
          in: [
            TaskStatus.open,
            TaskStatus.in_progress,
            TaskStatus.completed,
          ],
        };
      }
    } else if (view === 'completed') {
      where.status = TaskStatus.completed;
    }

    if (query.status !== undefined) {
      where.status = query.status;
    }
    if (query.priority !== undefined) {
      where.priority = query.priority;
    }
    if (query.assigneeUserId !== undefined) {
      where.assigneeUserId = query.assigneeUserId;
    }
    if (query.dueFrom !== undefined || query.dueTo !== undefined) {
      where.dueAt = {};
      if (query.dueFrom !== undefined) {
        where.dueAt.gte = new Date(query.dueFrom);
      }
      if (query.dueTo !== undefined) {
        where.dueAt.lte = new Date(query.dueTo);
      }
    }

    const onlyCompleted =
      view === 'completed' || query.status === TaskStatus.completed;

    let orderBy: Prisma.TaskOrderByWithRelationInput[];
    if (onlyCompleted) {
      orderBy = [{ completedAt: 'desc' }, { updatedAt: 'desc' }];
    } else if (
      (view === 'assigned_to_me' || view === 'assigned_by_me') &&
      query.status === undefined
    ) {
      orderBy = [
        { status: 'asc' },
        { dueAt: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'asc' },
      ];
    } else {
      orderBy = [
        { dueAt: { sort: 'asc', nulls: 'last' } },
        { createdAt: 'asc' },
      ];
    }

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    return {
      items: rows.map((t) => this.toTaskResponse(t)),
      page,
      pageSize,
      total,
    };
  }

  async updateTask(
    workspaceId: string,
    taskId: string,
    actorUserId: string,
    membershipRole: MembershipRole,
    dto: UpdateTaskDto,
  ) {
    const task = await this.requireTaskInWorkspace(workspaceId, taskId);

    if (!this.canEditFields(actorUserId, task, membershipRole)) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'You are not allowed to update this task.',
      });
    }

    const keys: (keyof UpdateTaskDto)[] = [
      'title',
      'description',
      'assigneeUserId',
      'dueAt',
      'priority',
    ];
    const hasAny = keys.some((k) => dto[k] !== undefined);
    if (!hasAny) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'At least one field is required to update a task.',
      });
    }

    if (dto.assigneeUserId !== undefined) {
      await this.assertActiveAssignee(workspaceId, dto.assigneeUserId);
    }

    const data: Prisma.TaskUpdateInput = {};
    if (dto.title !== undefined) {
      data.title = dto.title.trim();
    }
    if (dto.description !== undefined) {
      data.description =
        dto.description === null ? null : dto.description.trim();
    }
    if (dto.assigneeUserId !== undefined) {
      data.assignee = { connect: { id: dto.assigneeUserId } };
    }
    if (dto.dueAt !== undefined) {
      data.dueAt = dto.dueAt === null ? null : new Date(dto.dueAt);
    }
    if (dto.priority !== undefined) {
      data.priority = dto.priority;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.task.update({
        where: { id: task.id },
        data,
      });

      if (dto.assigneeUserId !== undefined && dto.assigneeUserId !== task.assigneeUserId) {
        await tx.taskActivity.create({
          data: {
            workspaceId,
            taskId: task.id,
            actorUserId,
            eventType: TaskActivityEventType.assigned,
            meta: {
              fromUserId: task.assigneeUserId,
              toUserId: dto.assigneeUserId,
            },
          },
        });
      }
      if (dto.priority !== undefined && dto.priority !== task.priority) {
        await tx.taskActivity.create({
          data: {
            workspaceId,
            taskId: task.id,
            actorUserId,
            eventType: TaskActivityEventType.priority_changed,
            meta: { from: task.priority, to: dto.priority },
          },
        });
      }
      const prevDue = task.dueAt?.toISOString() ?? null;
      const nextDue = next.dueAt?.toISOString() ?? null;
      if (
        dto.dueAt !== undefined &&
        prevDue !== nextDue
      ) {
        await tx.taskActivity.create({
          data: {
            workspaceId,
            taskId: task.id,
            actorUserId,
            eventType: TaskActivityEventType.due_changed,
            meta: { from: prevDue, to: nextDue },
          },
        });
      }
      const titleOrDescChanged =
        (dto.title !== undefined && dto.title.trim() !== task.title) ||
        (dto.description !== undefined &&
          (dto.description === null ? null : dto.description.trim()) !==
            task.description);
      if (titleOrDescChanged) {
        await tx.taskActivity.create({
          data: {
            workspaceId,
            taskId: task.id,
            actorUserId,
            eventType: TaskActivityEventType.updated,
            meta: {
              titleChanged:
                dto.title !== undefined && dto.title.trim() !== task.title,
              descriptionChanged:
                dto.description !== undefined &&
                (dto.description === null ? null : dto.description.trim()) !==
                  task.description,
            },
          },
        });
      }

      return next;
    });

    return this.toTaskResponse(updated);
  }

  async changeTaskStatus(
    workspaceId: string,
    taskId: string,
    actorUserId: string,
    membershipRole: MembershipRole,
    dto: ChangeTaskStatusDto,
  ) {
    const task = await this.requireTaskInWorkspace(workspaceId, taskId);

    if (dto.status === TaskStatus.cancelled) {
      const r = dto.reason?.trim();
      if (!r) {
        throw new UnprocessableEntityException({
          code: 'VALIDATION_ERROR',
          message: 'reason is required when cancelling a task.',
        });
      }
    }

    assertStatusTransition(task, dto.status, actorUserId, membershipRole);

    const prevStatus = task.status;
    const data: Prisma.TaskUpdateInput = {
      status: dto.status,
    };

    if (dto.status === TaskStatus.completed) {
      data.completedAt = new Date();
      data.cancelReason = null;
    } else if (dto.status === TaskStatus.open) {
      data.completedAt = null;
    } else if (dto.status === TaskStatus.in_progress) {
      data.completedAt = null;
    } else if (dto.status === TaskStatus.cancelled) {
      data.completedAt = null;
      data.cancelReason = dto.reason!.trim();
    }

    const eventMeta = {
      fromStatus: prevStatus,
      toStatus: dto.status,
    };

    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.task.update({
        where: { id: task.id },
        data,
      });

      let eventType: TaskActivityEventType = TaskActivityEventType.status_changed;
      let meta: Prisma.InputJsonValue = eventMeta;

      if (dto.status === TaskStatus.completed) {
        eventType = TaskActivityEventType.completed;
        meta = { ...eventMeta, completedAt: next.completedAt?.toISOString() };
      } else if (prevStatus === TaskStatus.completed && dto.status === TaskStatus.open) {
        eventType = TaskActivityEventType.reopened;
        meta = eventMeta;
      } else if (dto.status === TaskStatus.cancelled) {
        eventType = TaskActivityEventType.cancelled;
        meta = {
          ...eventMeta,
          reason: dto.reason!.trim(),
        };
      }

      await tx.taskActivity.create({
        data: {
          workspaceId,
          taskId: task.id,
          actorUserId,
          eventType,
          meta,
        },
      });

      return next;
    });

    return this.toTaskResponse(updated);
  }

  async listTaskActivity(workspaceId: string, taskId: string) {
    await this.requireTaskInWorkspace(workspaceId, taskId);

    const rows = await this.prisma.taskActivity.findMany({
      where: { workspaceId, taskId },
      orderBy: { createdAt: 'asc' },
    });

    return {
      items: rows.map((r) => this.toActivityResponse(r)),
    };
  }
}
