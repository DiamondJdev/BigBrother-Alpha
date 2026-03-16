import { IsString, IsNotEmpty } from 'class-validator';

export class DownloadObjectParamsDto {
  @IsString()
  @IsNotEmpty()
  key: string;
}