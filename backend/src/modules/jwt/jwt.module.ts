import { Module } from "@nestjs/common";
import { JwtModule as NestJwtModule, JwtModuleOptions } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtService } from "./jwt.service";
import type { StringValue } from "ms";

@Module({
  imports: [
    NestJwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const secret = configService.get<string>("JWT_SECRET");
        const accessExp = configService.get<StringValue>("JWT_ACCESS_EXP");
        const refreshExp = configService.get<StringValue>("JWT_REFRESH_EXP");

        if (!secret) {
          throw new Error(
            "JWT_SECRET is not defined in the environment variables",
          );
        }
        if (!accessExp) {
          throw new Error(
            "JWT_ACCESS_EXP is not defined in the environment variables",
          );
        }
        if (!refreshExp) {
          throw new Error(
            "JWT_REFRESH_EXP is not defined in the environment variables",
          );
        }

        return {
          secret,
          signOptions: {
            algorithm: "HS256",
            expiresIn: accessExp,
          },
        };
      },
    }),
  ],
  providers: [JwtService],
  exports: [JwtService],
})
export class JwtModule {}
