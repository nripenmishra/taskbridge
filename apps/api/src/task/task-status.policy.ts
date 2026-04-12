import { HttpException, HttpStatus } from '@nestjs/common';
import { MembershipRole, TaskStatus, type Task } from '@prisma/client';

function invalidTransition(): never {
  throw new HttpException(
    {
      code: 'INVALID_STATUS_TRANSITION',
      message: 'That status change is not allowed for your role or the current task state.',
    },
    HttpStatus.UNPROCESSABLE_ENTITY,
  );
}

/**
 * Enforces docs/api-contract.md §5 and §3 (assignee vs creator/admin).
 */
export function assertStatusTransition(
  task: Pick<Task, 'status' | 'assigneeUserId' | 'creatorUserId'>,
  nextStatus: TaskStatus,
  actorUserId: string,
  membershipRole: MembershipRole,
): void {
  if (task.status === TaskStatus.cancelled) {
    invalidTransition();
  }
  if (nextStatus === task.status) {
    invalidTransition();
  }

  const isAssignee = actorUserId === task.assigneeUserId;
  const isCreator = actorUserId === task.creatorUserId;
  const creatorOrAdmin =
    isCreator || membershipRole === MembershipRole.admin;

  switch (task.status) {
    case TaskStatus.open:
      if (nextStatus === TaskStatus.in_progress && isAssignee) return;
      if (nextStatus === TaskStatus.completed && isAssignee) return;
      if (nextStatus === TaskStatus.cancelled && creatorOrAdmin) return;
      break;
    case TaskStatus.in_progress:
      if (nextStatus === TaskStatus.open && isAssignee) return;
      if (nextStatus === TaskStatus.completed && isAssignee) return;
      if (nextStatus === TaskStatus.cancelled && creatorOrAdmin) return;
      break;
    case TaskStatus.completed:
      if (nextStatus === TaskStatus.open && creatorOrAdmin) return;
      break;
    default:
      break;
  }
  invalidTransition();
}
