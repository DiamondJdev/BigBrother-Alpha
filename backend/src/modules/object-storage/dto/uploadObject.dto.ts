import { IsBase64, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadObjectDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  @MaxLength(10 * 1024 * 1024, { message: 'data must not exceed 10MB when base64-encoded' })
  data: string;
}