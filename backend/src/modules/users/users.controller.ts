import { Controller, Get, Param, Body, Patch, Delete, UseGuards, Request, HttpCode, HttpStatus, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { UpdateUserDto } from '../common/dto/updateUser.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/flow/roles.guard';
import { Roles } from '../common/flow/roles.decorator';
import { UserRole } from '../common/utils/userRole.enum';
import type { AuthenticatedRequest } from '../common/AuthenticatedRequest';

@Controller('users')
@UseGuards(JwtAuthGuard) // All user endpoints require authentication
export class UsersController {
	constructor(private readonly usersService: DbService) {}

	@Get()
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	@HttpCode(HttpStatus.OK)
	async findAll() {
		const users = await this.usersService.findAll();
		if (!users) throw new NotFoundException({ message: 'No users found' });
		return {
			message: 'Users retrieved successfully',
			data: users.map((user) => ({
				id: user.id,
				username: user.username,
				createdAt: user.createdAt,
				role: user.role,
			})),
		};
	}

	@Get('me')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.USER)
	@HttpCode(HttpStatus.OK)
	findMe(@Request() req: AuthenticatedRequest) {
		return {
			message: 'User retrieved successfully',
			id: req.user.id,
			username: req.user.username,
			role: req.user.role,
		};
	}

	@Delete(':uuid')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN)
	@HttpCode(HttpStatus.NO_CONTENT)
	async deleteUser(@Param('uuid') uuid: string) {
		await this.usersService.remove(uuid);
	}

	@Patch(':uuid')
	@UseGuards(RolesGuard)
	@Roles(UserRole.ADMIN, UserRole.USER)
	@HttpCode(HttpStatus.OK)
	async updateUser(
		@Param('uuid') uuid: string,
		@Body() updateUserDto: UpdateUserDto,
		@Request() req: AuthenticatedRequest,
	) {
		// Only allow non-admin users to update their own record
		if (req.user.role !== UserRole.ADMIN && req.user.id !== uuid) {
			throw new ForbiddenException({ message: 'Insufficient permissions to update this user' });
		}

		try {
			await this.usersService.update(uuid, updateUserDto);
		} catch (error) {
			if (error instanceof NotFoundException) throw new NotFoundException({ message: 'User not found' });
			throw error;
		}
		return { message: 'User updated successfully' };
	}
}
