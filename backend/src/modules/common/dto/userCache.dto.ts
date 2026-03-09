/**
 * Data Transfer Object for caching user data.
 *
 * This DTO explicitly excludes sensitive fields like passwords and refresh tokens
 * that should never be stored in external cache systems like Redis.
 *
 * Cached data should only include fields that are:
 * - Safe to store in external systems
 * - Frequently accessed
 * - Non-sensitive
 */
export class UserCacheDto {
  // User's unique identifier
  id: string;

  // Username for display and identification
  username: string;

  // User's role for authorization checks
  role: string;

  /**
   * When the refresh token expires (Date)
   * Safe to cache as it's not the actual token
   */
  refreshTokenExpiresAt?: Date;

  // When this user record was created
  createdAt?: Date;

  constructor(partial: Partial<UserCacheDto>) {
    Object.assign(this, partial);
  }
}
