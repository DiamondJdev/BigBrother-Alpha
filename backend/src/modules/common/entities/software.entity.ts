import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

export enum SoftwareStatus {
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity({ name: "software" })
@Index("idx_software_tenant_id", ["tenantId"])
export class Software {
  @PrimaryGeneratedColumn("uuid")
  id?: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ type: "uuid" })
  tenantId: string;

  @Column({
    type: "enum",
    enum: SoftwareStatus,
    default: SoftwareStatus.SUBMITTED,
  })
  status: SoftwareStatus;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt?: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt?: Date;
}