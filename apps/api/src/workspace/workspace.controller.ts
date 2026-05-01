import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { ActiveWorkspaceMemberGuard } from './guards/active-workspace-member.guard';
import { WorkspaceAdminGuard } from './guards/workspace-admin.guard';
import { WorkspaceService } from './workspace.service';

@Controller('workspaces')
@UseGuards(AuthGuard('jwt'))
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get()
  list(@CurrentUser() user: User) {
    return this.workspaceService.listWorkspaces(user.id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateWorkspaceDto, @CurrentUser() user: User) {
    return this.workspaceService.createWorkspace(user.id, dto.name);
  }

  @Get(':workspaceId/members')
  @UseGuards(ActiveWorkspaceMemberGuard)
  listMembers(@Param('workspaceId', ParseUUIDPipe) workspaceId: string) {
    return this.workspaceService.listMembers(workspaceId);
  }

  @Post(':workspaceId/invitations')
  @UseGuards(ActiveWorkspaceMemberGuard, WorkspaceAdminGuard)
  createInvitation(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: User,
  ) {
    return this.workspaceService.createInvitation(
      workspaceId,
      user.id,
      dto.email,
    );
  }

  @Get(':workspaceId/invitations')
  @UseGuards(ActiveWorkspaceMemberGuard, WorkspaceAdminGuard)
  listPendingInvitations(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
  ) {
    return this.workspaceService.listPendingInvitations(workspaceId);
  }
}
