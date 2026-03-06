import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { RolesModule } from "./roles/roles.module";
import { JwtModule } from "./jwt/jwt.module";
import { DbModule } from "./db/db.module";
import { CommonModule } from "./common/common.module";

/** DO NOT DELETE
 * app.module is the master module that imports all other modules
 * Deleting app.module means that no other modules would be runnable
 *
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ["./src/.env.production", "./src/.env", "./.env"],
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || '5432'),
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
      }
    }),
    RolesModule,
    UsersModule,
    AuthModule,
    JwtModule,
    DbModule,
    CommonModule,
  ],
})
export class AppModule {}
