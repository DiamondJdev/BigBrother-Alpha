/**
 * TTL constants in seconds for each cached resource.
 *
 * Rationale:
 *  USER        — 5 min: re-fetched on every authenticated request via JwtAuthGuard.
 *                Short TTL limits stale-data window while still absorbing burst traffic.
 *  USER_ROLE   — 15 min: roles change rarely; longer TTL gives the biggest throughput gain
 *                on role-checked endpoints.
 *  ALL_USERS   — 2 min: admin-only list, not latency-critical; kept short so new registrations
 *                appear quickly.
 *  REFRESH_TOKEN — 7 days: must match the default JWT_REFRESH_EXP so the cached hash stays
 *                  valid as long as the token itself. Rotated out on every token refresh anyway.
 */
export const CacheTTL = {
  USER: 300,
  USER_ROLE: 900,
  ALL_USERS: 120,
  REFRESH_TOKEN: 604_800,
} as const;
