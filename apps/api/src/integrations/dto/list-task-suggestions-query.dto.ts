import { TaskSuggestionStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListTaskSuggestionsQueryDto {
  @IsOptional()
  @IsEnum(TaskSuggestionStatus)
  status?: TaskSuggestionStatus;
}
