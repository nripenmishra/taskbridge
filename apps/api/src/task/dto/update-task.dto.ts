import { TaskPriority } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsUUID()
  assigneeUserId?: string;

  @IsOptional()
  @ValidateIf((_o, v) => v !== null)
  @IsDateString()
  dueAt?: string | null;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;
}
