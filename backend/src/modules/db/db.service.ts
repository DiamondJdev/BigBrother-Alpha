import {
	ConflictException,
	Injectable,
	InternalServerErrorException,
	BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';
import * as bcrypt from 'bcrypt';
import { QueryFailedError, Repository } from 'typeorm';

import { User } from '../common/entities/user.entity';
import { UpdateUserDto } from '../common/dto/updateUser.dto';
import { isValidRole } from '../common/utils/roleChecker';
import { CacheService } from '../cache/cache.service';
import { CacheKeys } from '../cache/constants/cache-keys';
import { CacheTTL } from '../cache/constants/cache-ttl';

@Injectable()
export class DbService {
	constructor(
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
		private readonly cacheService: CacheService,
	) {}
	
	/**
	 * Verifies database connectivity using a trivial query. 
	 * 
	 * @returns True if the database responds, false otherwise
	 */
	async healthCheck(): Promise<boolean> {
		try {
			await this.userRepository.query('SELECT 1');

			await this.userRepository.query('SELECT version()');

			return true;
		} catch {
			return false;
		}
	}
	
	// TODO: Remove findAll() method, replace require parameters
	/**
	 * Returns all users.
	 * 
	 * NOTE: This method is intended to be removed in favor of parameterized queries.
	 * 
	 * @returns User[] An array of all user records in the database
	 */
	async findAll(): Promise<User[]> {
		const cached = await this.cacheService.get<User[]>(CacheKeys.allUsers());
		if (cached) return cached;

		const users = await this.userRepository.find();
		await this.cacheService.set(CacheKeys.allUsers(), users, CacheTTL.ALL_USERS);
		return users;
	}
	
	/**
	 * Creates a new user record.
	 * 
	 * @param user User entity to persist
	 * @throws ConflictException if username already exists
	 * @throws InternalServerErrorException for unexpected failures
	 * @returns Created user
	 */
	async create(user: User): Promise<User | undefined> {
		try {
			const created = await this.userRepository.save(user);
			await this.cacheService.del(CacheKeys.allUsers());
			return created;
		} catch (error) {
			if (error instanceof QueryFailedError) throw new ConflictException('User already exists');
			throw new InternalServerErrorException('Failed to create user');
		}
	}
	
	/**
	 * Finds a user by id or username.
	 * 
	 * @param uuid User id
	 * @param username Username
	 * @throws BadRequestException if no parameters are provided
	 * @returns User or null if not found
	 */
	async findOne(uuid?: string, username?: string): Promise<User | null> {
		if (!uuid && !username) throw new BadRequestException('No Parameters provided');

		// Cache is keyed by UUID only; username lookups (login path) always hit the DB.
		if (uuid) {
			const cached = await this.cacheService.get<User>(CacheKeys.user(uuid));
			console.log(`Cache lookup for user:${uuid} returned ${cached ? 'HIT' : 'MISS'}`);
			if (cached) return cached;
		}

		const user = uuid
			? await this.userRepository.findOneBy({ id: uuid })
			: await this.userRepository.findOneBy({ username });

		const resolved = user ?? null;
		if (uuid && resolved) {
			await this.cacheService.set(CacheKeys.user(uuid), resolved, CacheTTL.USER);
		}
		return resolved;
	}
	
	/**
	 * Removes a user by id.
	 * 
	 * @param uuid User id
	 * @throws BadRequestException if user is not found
	 * @returns Removed user
	 */
	async remove(uuid: string): Promise<void> {
		const result = await this.userRepository.delete({ id: uuid });
		if (result.affected === 0) throw new BadRequestException('Could not find user to delete');
		await this.cacheService.del(
			CacheKeys.user(uuid),
			CacheKeys.userRole(uuid),
			CacheKeys.refreshToken(uuid),
			CacheKeys.allUsers(),
		);
	}
	
	/**
	 * Updates a user's password.
	 * 
	 * @param uuid User id
	 * @param updateUserDto Update payload
	 * @throws BadRequestException if user is not found
	 * @returns void
	 */
	async update(uuid: string, updateUserDto: UpdateUserDto): Promise<void> {
		const saltRounds = 12;
		const hashedPassword = await bcrypt.hash(updateUserDto.password, saltRounds);

		const result = await this.userRepository.update(
			{ id: uuid },
			{ password: hashedPassword },
		);

		if (result.affected === 0) throw new BadRequestException('Could not find user to update');
		await this.cacheService.del(CacheKeys.user(uuid));
	}
	
	/**
	 * Updates a user's role.
	 * 
	 * @param uuid User id
	 * @param role New role
	 * @throws BadRequestException if role is invalid or user not found
	 * @returns void
	 */
	async updateRole(uuid: string, role: string): Promise<void> {
		if (!isValidRole(role)) throw new BadRequestException('Invalid role');

		const result = await this.userRepository.update(
			{ id: uuid },
			{ role },
		);

		if (result.affected === 0) throw new BadRequestException('Could not find user to update role');
		await this.cacheService.del(
			CacheKeys.user(uuid),
			CacheKeys.userRole(uuid),
			CacheKeys.allUsers(),
		);
	}
	
	/**
	 * Returns the stored refresh token hash for a user.
	 *
	 * Reads from the dedicated `refresh_token:{userId}` cache key, which is
	 * always written atomically alongside the DB in saveRefreshToken. This key
	 * is always current and is never stale — unlike the broader `user:{userId}`
	 * entity cache, which can lag behind a rotation if its DEL is dropped.
	 *
	 * Falls back to a direct DB query on a cache miss.
	 *
	 * @param userId User id
	 * @returns The current refresh token hash, or null if none is stored
	 */
	async getRefreshTokenHash(userId: string): Promise<string | null> {
		const cached = await this.cacheService.get<string>(CacheKeys.refreshToken(userId));
		if (cached !== null) return cached;
		const user = await this.userRepository.findOneBy({ id: userId });
		return user?.refreshTokenHash ?? null;
	}

	/**
	 * Saves a refresh token hash for the user.
	 * 
	 * @param userId User id
	 * @param refreshTokenHash Hashed refresh token
	 * @throws BadRequestException if user not found
	 * @returns void
	 */
	async saveRefreshToken(userId: string, refreshTokenHash: string): Promise<void> {
		const result = await this.userRepository.update(
			{ id: userId },
			{ refreshTokenHash },
		);

		if (result.affected === 0) throw new BadRequestException('Could not find user to save refresh token');
		// Cache the hash and evict the stale full-user record in a single round trip.
		await this.cacheService.set(CacheKeys.refreshToken(userId), refreshTokenHash, CacheTTL.REFRESH_TOKEN);
		await this.cacheService.del(CacheKeys.user(userId));
	}

	/**
	 * Clears a user's refresh token and expiration fields (logout/revoke).
	 *
	 * @param userId User id
	 * @throws BadRequestException if user not found
	 */
	async clearRefreshToken(userId: string): Promise<void> {
		const result = await this.userRepository.update(
			{ id: userId },
			{ refreshTokenHash: '', refreshTokenExpiresAt: '' },
		);

		if (result.affected === 0) throw new BadRequestException('Could not find user to clear refresh token');
		await this.cacheService.del(
			CacheKeys.refreshToken(userId),
			CacheKeys.user(userId),
		);
	}
}

