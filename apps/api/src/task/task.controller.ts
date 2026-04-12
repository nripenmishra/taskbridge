import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { User } from '@prisma/client';
import type { Request } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActiveWorkspaceMemberGuard } from '../workspace/guards/active-workspace-member.guard';
import { ChangeTaskStatusDto } from './dto/change-task-status.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskService } from './task.service';

@Controller('workspaces/:workspaceId/tasks')
@UseGuards(AuthGuard('jwt'), ActiveWorkspaceMemberGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  list(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Query() query: ListTasksQueryDto,
    @CurrentUser() user: User,
  ) {
    return this.taskService.listTasks(workspaceId, user.id, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: User,
  ) {
    return this.taskService.createTask(workspaceId, user.id, dto);
  }

  @Get(':taskId/activity')
  listActivity(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.taskService.listTaskActivity(workspaceId, taskId);
  }

  @Post(':taskId/status')
  changeStatus(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: ChangeTaskStatusDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const m = req.workspaceMembership!;
    return this.taskService.changeTaskStatus(
      workspaceId,
      taskId,
      user.id,
      m.role,
      dto,
    );
  }

  @Get(':taskId')
  get(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
  ) {
    return this.taskService.getTask(workspaceId, taskId);
  }

  @Patch(':taskId')
  update(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('taskId', ParseUUIDPipe) taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: User,
    @Req() req: Request,
  ) {
    const m = req.workspaceMembership!;
    return this.taskService.updateTask(
      workspaceId,
      taskId,
      user.id,
      m.role,
      dto,
    );
  }
}
