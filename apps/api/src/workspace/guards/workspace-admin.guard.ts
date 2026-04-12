import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import type { Request } from 'express';

@Injectable()
export class WorkspaceAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const m = req.workspaceMembership;
    if (!m) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Workspace context missing.',
      });
    }
    if (m.role !== MembershipRole.admin) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Only workspace administrators can perform this action.',
      });
    }
    return true;
  }
}
