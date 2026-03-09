/**
 * Typed cache key builders for all cached entities.
 * Centralising key construction here prevents typos and key collisions
 * across the codebase.
 */
export const CacheKeys = {
  /** Full user record, looked up by UUID */
  user: (uuid: string): string => `user:${uuid}`,

  /** Sanitized user cache (safe for external Redis), excludes sensitive fields */
  userSafe: (uuid: string): string => `user_safe:${uuid}`,

  /** Isolated role string for a user */
  userRole: (uuid: string): string => `user_role:${uuid}`,

  /** Hashed refresh token for a user, mirrors the DB column */
  refreshToken: (userId: string): string => `refresh_token:${userId}`,

  /** Admin-facing full user list from DbService.findAll() */
  allUsers: (): string => `users:all`,
} as const;
