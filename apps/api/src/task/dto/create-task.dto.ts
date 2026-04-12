import { TaskPriority } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  assigneeUserId!: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsEnum(TaskPriority)
  priority!: TaskPriority;
}
