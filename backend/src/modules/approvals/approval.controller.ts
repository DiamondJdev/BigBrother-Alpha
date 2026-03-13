import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApprovalService } from './approval.service';
import { SubmitApprovalDto } from './dto/submit-approval.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/flow/roles.guard';
import { Roles } from '../common/flow/roles.decorator';
import { UserRole } from '../common/utils/userRole.enum';
import type { AuthenticatedRequest } from '../common/AuthenticatedRequest';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Post('legal')
  @UseGuards(RolesGuard)
  @Roles(UserRole.LEGAL)
  async submitLegalApproval(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SubmitApprovalDto,
  ) {
    const approval = await this.approvalService.submitLegalApproval(req.user.id, dto);
    return { message: 'Legal approval submitted', approval };
  }

  @Post('security')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SECURITY)
  async submitSecurityApproval(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SubmitApprovalDto,
  ) {
    const approval = await this.approvalService.submitSecurityApproval(req.user.id, dto);
    return { message: 'Security approval submitted', approval };
  }

  @Post('it')
  @UseGuards(RolesGuard)
  @Roles(UserRole.IT)
  async submitITApproval(
    @Request() req: AuthenticatedRequest,
    @Body() dto: SubmitApprovalDto,
  ) {
    const approval = await this.approvalService.submitITApproval(req.user.id, dto);
    return { message: 'IT approval submitted', approval };
  }
}