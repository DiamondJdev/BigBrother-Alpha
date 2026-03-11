import { IsString, IsNotEmpty, MaxLength } from "class-validator";

export class loginUserDto {
  @IsNotEmpty({ message: "Username is required" })
  @IsString({ message: "Username must be a string" })
  @MaxLength(128, { message: "Username must be less than 128 characters" })
  username: string;

  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  @MaxLength(128, { message: "Password must be less than 128 characters" })
  password: string;
}
