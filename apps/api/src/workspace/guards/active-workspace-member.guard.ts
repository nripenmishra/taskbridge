import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipStatus } from '@prisma/client';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActiveWorkspaceMemberGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req.user as User | undefined;
    if (!user?.id) {
      return false;
    }

    const workspaceId = req.params['workspaceId'];
    if (!workspaceId || typeof workspaceId !== 'string') {
      throw new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found.',
      });
    }

    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) {
      throw new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found.',
      });
    }

    const membership = await this.prisma.membership.findFirst({
      where: {
        workspaceId,
        userId: user.id,
        status: MembershipStatus.active,
      },
    });
    if (!membership) {
      throw new NotFoundException({
        code: 'WORKSPACE_NOT_FOUND',
        message: 'Workspace not found.',
      });
    }

    req.workspaceMembership = membership;
    return true;
  }
}
