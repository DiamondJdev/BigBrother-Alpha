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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
