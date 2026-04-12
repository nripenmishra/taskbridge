import { Module } from '@nestjs/common';
import { ActiveWorkspaceMemberGuard } from './guards/active-workspace-member.guard';
import { WorkspaceAdminGuard } from './guards/workspace-admin.guard';
import { InvitationsController } from './invitations.controller';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  controllers: [WorkspaceController, InvitationsController],
  providers: [
    WorkspaceService,
    ActiveWorkspaceMemberGuard,
    WorkspaceAdminGuard,
  ],
  exports: [WorkspaceService, ActiveWorkspaceMemberGuard],
})
export class WorkspaceModule {}
