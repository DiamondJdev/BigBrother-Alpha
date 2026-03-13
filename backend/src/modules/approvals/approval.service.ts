import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval, ApprovalType, ApprovalDecision } from '../common/entities/approval.entity';
import { Software, SoftwareStatus } from '../common/entities/software.entity';
import { User } from '../common/entities/user.entity';
import { SubmitApprovalDto } from './dto/submit-approval.dto';
import { UserRole } from '../common/utils/userRole.enum';

@Injectable()
export class ApprovalService {
  constructor(
    @InjectRepository(Approval)
    private readonly approvalRepository: Repository<Approval>,
    @InjectRepository(Software)
    private readonly softwareRepository: Repository<Software>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async submitLegalApproval(userId: string, dto: SubmitApprovalDto): Promise<Approval> {
    await this.validateUserRole(userId, UserRole.LEGAL);
    return this.submitApproval(userId, dto, ApprovalType.LEGAL);
  }

  async submitSecurityApproval(userId: string, dto: SubmitApprovalDto): Promise<Approval> {
    await this.validateUserRole(userId, UserRole.SECURITY);
    return this.submitApproval(userId, dto, ApprovalType.SECURITY);
  }

  async submitITApproval(userId: string, dto: SubmitApprovalDto): Promise<Approval> {
    await this.validateUserRole(userId, UserRole.IT);
    return this.submitApproval(userId, dto, ApprovalType.IT);
  }

  private async validateUserRole(userId: string, requiredRole: UserRole): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.roles.includes(requiredRole)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private async submitApproval(userId: string, dto: SubmitApprovalDto, type: ApprovalType): Promise<Approval> {
    // Check if software exists
    const software = await this.softwareRepository.findOne({ where: { id: dto.softwareId } });
    if (!software) {
      throw new NotFoundException('Software not found');
    }

    // Assume tenantId from software or user, for now use software.tenantId
    const tenantId = software.tenantId;

    const approval = this.approvalRepository.create({
      tenantId,
      softwareId: dto.softwareId,
      approvalType: type,
      approvedBy: userId,
      decision: dto.decision,
      comments: dto.comments,
    });

    const savedApproval = await this.approvalRepository.save(approval);

    // Update software status based on approvals
    const status = await this.getApprovalStatus(dto.softwareId);
    let newStatus = SoftwareStatus.SUBMITTED;
    if (status.overall === 'approved') {
      newStatus = SoftwareStatus.APPROVED;
    } else if (status.overall === 'rejected') {
      newStatus = SoftwareStatus.REJECTED;
    }
    await this.softwareRepository.update({ id: dto.softwareId }, { status: newStatus });

    return savedApproval;
  }

  async getApprovalStatus(softwareId: string): Promise<{ legal: ApprovalDecision | null; security: ApprovalDecision | null; it: ApprovalDecision | null; overall: 'approved' | 'rejected' | 'pending' }> {
    const approvals = await this.approvalRepository.find({
      where: { softwareId },
      order: { timestamp: 'DESC' },
    });

    const latestApprovals = {
      [ApprovalType.LEGAL]: null as ApprovalDecision | null,
      [ApprovalType.SECURITY]: null as ApprovalDecision | null,
      [ApprovalType.IT]: null as ApprovalDecision | null,
    };

    for (const approval of approvals) {
      if (!latestApprovals[approval.approvalType]) {
        latestApprovals[approval.approvalType] = approval.decision;
      }
    }

    const legal = latestApprovals[ApprovalType.LEGAL];
    const security = latestApprovals[ApprovalType.SECURITY];
    const it = latestApprovals[ApprovalType.IT];
    let overall: 'approved' | 'rejected' | 'pending' = 'pending';
    if (legal && security && it) {
      if (legal === ApprovalDecision.APPROVED && security === ApprovalDecision.APPROVED && it === ApprovalDecision.APPROVED) {
        overall = 'approved';
      } else {
        overall = 'rejected';
      }
    }

    return { legal, security, it, overall };
  }
}