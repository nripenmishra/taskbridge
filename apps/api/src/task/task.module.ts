import { Module } from '@nestjs/common';
import { WorkspaceModule } from '../workspace/workspace.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';

@Module({
  imports: [WorkspaceModule],
  controllers: [TaskController],
  providers: [TaskService],
})
export class TaskModule {}
