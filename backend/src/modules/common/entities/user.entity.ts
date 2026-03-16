import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { UserRole } from "../utils/userRole.enum";

@Entity({ name: "users" })
@Index("idx_users_username", ["username"]) // Unique index already exists, but explicit is better
export class User {
  // Auto-generated UUID primary key for the user entity
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  // TypeORM.save() will throw QueryFailedError on duplicate username
  @Column({ unique: true, length: 64 })
  username: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt?: Date;

  @Column({ length: 255 })
  password: string;

  @Column("text", { array: true, default: ["user"] })
  roles: UserRole[];

  @Column({ type: "varchar", length: 512, nullable: true })
  refreshTokenHash?: string | null;

  @Column({ type: "timestamptz", nullable: true })
  refreshTokenExpiresAt?: Date | null;
}
