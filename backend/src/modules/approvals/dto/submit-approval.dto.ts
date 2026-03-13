import { IsEnum, IsOptional, IsString } from "class-validator";
import { ApprovalDecision } from "../../common/entities/approval.entity";

export class SubmitApprovalDto {
  @IsString()
  softwareId: string;

  @IsEnum(ApprovalDecision)
  decision: ApprovalDecision;

  @IsOptional()
  @IsString()
  comments?: string;
}
