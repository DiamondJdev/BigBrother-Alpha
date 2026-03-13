import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { RolesModule } from "./roles/roles.module";
import { JwtModule } from "./jwt/jwt.module";
import { DbModule } from "./db/db.module";
import { CommonModule } from "./common/common.module";
import { CacheModule } from "./cache/cache.module";
import { ApprovalsModule } from "./approvals/approval.module";
import { QueueModule } from "./queue/queue.module";
import { ObjectStorageModule } from "./object-storage/object-storage.module";
import * as Joi from 'joi';

/**
 * app.module is the master module that imports all other modules
 * Deleting app.module means that no other modules would be runnable
 *
 * This module also sets up the database connection using TypeORM and loads environment variables using ConfigModule
 * It also configures the database connection with connection pooling and logging settings based on the environment
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "./.env",
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        UPSTASH_REDIS_REST_URL: Joi.string().required(),
        UPSTASH_REDIS_REST_TOKEN: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        S3_BUCKET: Joi.string().required(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 60000, // 1 minute = 60,000ms
        limit: 100, // 100 requests per minute (which is less restrictive than 100 every 15 minutes)
      },
      {
        name: "medium",
        ttl: 900000, // 15 minutes = 900,000ms
        limit: 100, // 100 requests every 15 minutes
      },
    ]),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432"),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_NAME || "margin_dev",
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== "production",
      ssl: false,
      logging: process.env.NODE_ENV === "development" ? ["error"] : [],
      extra: {
        max: 30,
        min: 10,
        idleTimeoutMillis: 60000,
        connectionTimeoutMillis: 5000,
        acquireTimeoutMillis: 10000,
      },
    }),
    RolesModule,
    UsersModule,
    AuthModule,
    JwtModule,
    DbModule,
    CommonModule,
    CacheModule,
    ApprovalsModule,
    QueueModule,
    ObjectStorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
