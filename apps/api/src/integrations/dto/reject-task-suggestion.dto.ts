import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RejectTaskSuggestionDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
