import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ApprovalDecision } from "../../common/entities/approval.entity";

export class SubmitApprovalDto {
  @IsUUID()
  softwareId: string;

  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @IsOptional()
  @IsString()
  comments?: string;
}