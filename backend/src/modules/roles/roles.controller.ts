import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { RolesService } from "./roles.service";
import { JwtAuthGuard } from "../auth/guard/jwt-auth.guard";
import { RolesGuard } from "../common/flow/roles.guard";
import { Roles } from "../common/flow/roles.decorator";
import { UserRole } from "../common/utils/userRole.enum";
import type { AuthenticatedRequest } from "../common/AuthenticatedRequest";

@Controller("roles")
@UseGuards(JwtAuthGuard) // Require authentication for all role endpoints
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get("me")
  @HttpCode(HttpStatus.OK)
  async getUserRole(
    @Request() req: AuthenticatedRequest,
  ): Promise<{ message: string; roles: UserRole[] }> {
    const roles = await this.rolesService.getRoles(req.user.id);
    if (!roles) throw new NotFoundException({ message: "User not found" });
    return {
      message: "Roles retrieved successfully",
      roles: roles,
    };
  }

  @Get(":uuid")
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN) // Only admins can view roles
  @HttpCode(HttpStatus.OK)
  async getRole(
    @Param("uuid") uuid: string,
  ): Promise<{ message: string; roles: UserRole[] }> {
    const roles = await this.rolesService.getRoles(uuid);
    if (!roles) throw new NotFoundException({ message: "User not found" });
    return {
      message: "Roles retrieved successfully",
      roles: roles,
    };
  }

  // Deprecated endpoint for updating user roles,
  // Will be re-enabled after refactoring for admin role escalation

//   @Patch(":uuid")
//   @UseGuards(RolesGuard)
//   @Roles(UserRole.ADMIN)
//   @HttpCode(HttpStatus.GONE)d
//   updateUser() {
//     return {
//       message:
//         "This route is deprecated and will not be re-enabled until further notice",
//     };
//   }
}
