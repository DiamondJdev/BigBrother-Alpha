import {
    CanActivate,
    ExecutionContext,
    Injectable,
    ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { hasPermission } from '../utils/roleChecker';
import { UserRole } from '../utils/userRole.enum';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(private reflector: Reflector) {}
	canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
		const reflectedRoles = this.reflector.get<string[] | UserRole[]>('roles', context.getHandler());
		if (!reflectedRoles || !Array.isArray(reflectedRoles) || reflectedRoles.length === 0) {
			// No roles metadata defined: allow access (preserve existing behavior)
			return true;
		}

		const requiredRoles: UserRole[] = reflectedRoles
			.map((role) => {
				if (typeof role !== 'string') {
					return role;
				}
				const validRoles = Object.values(UserRole) as string[];
				if (validRoles.includes(role)) {
					return role as UserRole;
				}
				return undefined;
			})
			.filter((role): role is UserRole => role !== undefined);

		if (requiredRoles.length === 0) {
			// All reflected roles were invalid: treat as if no roles were required
			return true;
		}
		
		const req = context.switchToHttp().getRequest<Request & { user?: { roles?: UserRole[] } }>();
		const { user } = req;
		if (!user) { throw new ForbiddenException('User not authenticated'); }
		
		if (!user.roles || !Array.isArray(user.roles)) throw new ForbiddenException('User roles not found');
		
		const hasRole = hasPermission(user.roles, requiredRoles);
		if (!hasRole) { throw new ForbiddenException('Insufficient permissions'); }

		return true;
	}
}
