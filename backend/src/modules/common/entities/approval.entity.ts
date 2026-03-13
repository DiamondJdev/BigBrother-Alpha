import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

export enum ApprovalType {
  LEGAL = 'LEGAL',
  SECURITY = 'SECURITY',
  IT = 'IT',
}

export enum ApprovalDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity({ name: "approvals" })
@Index("idx_approvals_tenant_software_type", ["tenantId", "softwareId", "approvalType"])
@Index("idx_approvals_timestamp", ["timestamp"])
export class Approval {
  @PrimaryGeneratedColumn("uuid")
  approvalId?: string;

  @Column({ type: "uuid" })
  tenantId: string;

  @Column({ type: "uuid" })
  softwareId: string;

  @Column({
    type: "enum",
    enum: ApprovalType,
  })
  approvalType: ApprovalType;

  @Column({ type: "uuid" })
  approvedBy: string; // user_id

  @Column({
    type: "enum",
    enum: ApprovalDecision,
  })
  decision: ApprovalDecision;

  @Column({ type: "text", nullable: true })
  comments?: string;

  @CreateDateColumn({ type: "timestamptz" })
  timestamp?: Date;
}