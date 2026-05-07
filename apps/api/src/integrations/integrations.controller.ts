import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApproveTaskSuggestionDto } from './dto/approve-task-suggestion.dto';
import { CreateAgentIngestTokenDto } from './dto/create-agent-ingest-token.dto';
import { IngestTaskSuggestionDto } from './dto/ingest-task-suggestion.dto';
import { ListTaskSuggestionsQueryDto } from './dto/list-task-suggestions-query.dto';
import { RejectTaskSuggestionDto } from './dto/reject-task-suggestion.dto';
import { IntegrationsService } from './integrations.service';

@Controller()
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Post('integrations/gmail-agent/ingest')
  @HttpCode(HttpStatus.CREATED)
  ingest(
    @Headers('authorization') authHeader: string | undefined,
    @Body() dto: IngestTaskSuggestionDto,
  ) {
    return this.integrationsService.ingestTaskSuggestion(authHeader ?? '', dto);
  }

  @Get('task-suggestions')
  @UseGuards(AuthGuard('jwt'))
  listTaskSuggestions(
    @CurrentUser() user: User,
    @Query() query: ListTaskSuggestionsQueryDto,
  ) {
    return this.integrationsService.listTaskSuggestions(user.id, query);
  }

  @Get('task-suggestions/:suggestionId')
  @UseGuards(AuthGuard('jwt'))
  getTaskSuggestion(
    @CurrentUser() user: User,
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
  ) {
    return this.integrationsService.getTaskSuggestion(user.id, suggestionId);
  }

  @Post('task-suggestions/test-ingest')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'))
  createTestSuggestion(@CurrentUser() user: User) {
    return this.integrationsService.createTestTaskSuggestion(user.id);
  }

  @Post('task-suggestions/:suggestionId/approve')
  @UseGuards(AuthGuard('jwt'))
  approveTaskSuggestion(
    @CurrentUser() user: User,
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
    @Body() dto: ApproveTaskSuggestionDto,
  ) {
    return this.integrationsService.approveTaskSuggestion(
      user.id,
      suggestionId,
      dto,
    );
  }

  @Post('task-suggestions/:suggestionId/reject')
  @UseGuards(AuthGuard('jwt'))
  rejectTaskSuggestion(
    @CurrentUser() user: User,
    @Param('suggestionId', ParseUUIDPipe) suggestionId: string,
    @Body() dto: RejectTaskSuggestionDto,
  ) {
    return this.integrationsService.rejectTaskSuggestion(
      user.id,
      suggestionId,
      dto.reason,
    );
  }

  @Post('me/agent-ingest-tokens')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(AuthGuard('jwt'))
  createToken(@CurrentUser() user: User, @Body() dto: CreateAgentIngestTokenDto) {
    return this.integrationsService.createAgentIngestToken(user.id, dto);
  }

  @Get('me/agent-ingest-tokens')
  @UseGuards(AuthGuard('jwt'))
  listTokens(@CurrentUser() user: User) {
    return this.integrationsService.listAgentIngestTokens(user.id);
  }

  @Delete('me/agent-ingest-tokens/:tokenId')
  @UseGuards(AuthGuard('jwt'))
  revokeToken(
    @CurrentUser() user: User,
    @Param('tokenId', ParseUUIDPipe) tokenId: string,
  ) {
    return this.integrationsService.revokeAgentIngestToken(user.id, tokenId);
  }
}
