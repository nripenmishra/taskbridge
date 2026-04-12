import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { WorkspaceService } from './workspace.service';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Post('accept')
  @UseGuards(AuthGuard('jwt'))
  accept(@Body() dto: AcceptInvitationDto, @CurrentUser() user: User) {
    return this.workspaceService.acceptInvitation(user.id, dto.token);
  }
}
