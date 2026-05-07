import {
  IsDateString,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class IngestTaskSuggestionSourceDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  messageId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  threadId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(320)
  from?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  bodyPreview?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;
}

export class IngestTaskSuggestionDto {
  @IsString()
  @MaxLength(200)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => IngestTaskSuggestionSourceDto)
  source?: IngestTaskSuggestionSourceDto;
}
