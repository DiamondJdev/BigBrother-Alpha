import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class enqueueJobDto {
  @IsString()
  @IsNotEmpty()
  queueName!: string;
  
  @IsObject()
  @IsOptional()
  job?: Record<string, unknown>;
}