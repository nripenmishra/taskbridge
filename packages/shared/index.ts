/**
 * Shared enums and types used by API and web.
 * Expand as you implement features.
 */
export const TaskStatus = {
  Open: 'open',
  InProgress: 'in_progress',
  Completed: 'completed',
  Cancelled: 'cancelled',
} as const;

export type TaskStatusValue = (typeof TaskStatus)[keyof typeof TaskStatus];

export const TaskPriority = {
  Critical: 'critical',
  High: 'high',
  Medium: 'medium',
  Low: 'low',
} as const;

export type TaskPriorityValue = (typeof TaskPriority)[keyof typeof TaskPriority];
