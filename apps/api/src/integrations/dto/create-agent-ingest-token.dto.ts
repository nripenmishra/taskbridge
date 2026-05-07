import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAgentIngestTokenDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  label?: string;
}
