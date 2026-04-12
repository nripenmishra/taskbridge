import type { Membership } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      /** Set by ActiveWorkspaceMemberGuard when the user is an active member. */
      workspaceMembership?: Membership;
    }
  }
}

export {};
