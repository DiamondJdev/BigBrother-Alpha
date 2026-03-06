# CLAUDE.md — backend/

This project-level CLAUDE.md is a short reference for future Claude Code sessions and contributors working in the backend/ NestJS template. It documents repository structure, important entry points, developer workflows, testing requirements, security checklist, and agent/tool recommendations so automation and agents can act consistently.

> Keep this file concise — it is intended to guide Claude Code agents and humans during coding sessions.

---

## Quick facts

- Project: NestJS Template (JWT auth, RBAC, TypeORM + SQLite)
- Language: TypeScript
- Framework: NestJS 11
- Test runner: Jest
- Local DB: SQLite (easy swap to Postgres)
- Main entry: [src/main.ts:7](src/main.ts#L7)
- Scripts: see [package.json:8](package.json#L8)

---

## Where to look first

- Bootstrap & global pipes/interceptors: [src/main.ts:7-33](src/main.ts#L7-L33)
- Auth module (login/register/refresh): [src/modules/auth/auth.module.ts](src/modules/auth/auth.module.ts)
- User entity: [src/modules/common/entities/user.entity.ts](src/modules/common/entities/user.entity.ts)
- DB service & conversion helpers: [src/modules/db/db.service.ts](src/modules/db/db.service.ts), [src/modules/db/utils/userConversion.ts](src/modules/db/utils/userConversion.ts)
- Logging service and interceptor: [src/modules/common/logging/services/logger.service.ts](src/modules/common/logging/services/logger.service.ts), [src/modules/common/logging/interceptors/logging.interceptor.ts](src/modules/common/logging/interceptors/logging.interceptor.ts)
- Example tests: [src/modules/db/db.service.spec.ts](src/modules/db/db.service.spec.ts), [src/modules/common/health/controller/health.controller.spec.ts](src/modules/common/health/controller/health.controller.spec.ts)

---

## Environment

- Environment variables are read via `@nestjs/config`. See README `Environment Variables` section.
- Required at runtime:
  - `JWT_SECRET` (must be set in production)
  - Optional but recommended: `PORT`, `JWT_EXPIRATION`, `JWT_REFRESH_EXP`
- Development default port: 5200
- Never commit real secrets. `.env` is in `.gitignore`.

---

## Coding & design conventions (project-level)

Follow the user's global coding-style rules; the most important are repeated here for quick access:

- Immutability: never mutate inputs in place. Always return new objects when changing state.
- Small focused files: prefer many small files (200–400 lines per file). Keep files < 800 lines.
- Validation at boundaries: use DTOs + ValidationPipe with `whitelist: true`, `transform: true`, `stopAtFirstError: true` (see [src/main.ts:23-28](src/main.ts#L23-L28)).
- Errors: handle explicitly and provide helpful messages; do not leak internals in responses.
- No hardcoded secrets or credential values in source.
- Use UUID v4 primary keys for users (prevents enumeration).

When making changes, limit diffs to what's requested. Avoid speculative refactors unless asked.

---

## Security checklist (apply before committing)

- No hardcoded secrets in code
- Required env vars validated at startup
- Input validation applied on all controllers (DTOs + pipes)
- Use parameterized queries / TypeORM repository APIs (avoid raw SQL)
- XSS/CSRF: this is an API-only backend; ensure frontend sanitizes outputs and add CSRF protections if serving forms or cookies in production
- Token security:
  - Refresh tokens are hashed in DB (bcrypt)
  - Access tokens short-lived (default 15m)
  - On refresh, rotate tokens and invalidate previous refresh hash
- Logging: do not log secrets or raw tokens

If a critical security issue is discovered, stop and use the security-reviewer agent.

---

## Testing & TDD

This repository follows the project's mandatory TDD workflow. Use agents accordingly.

- Always write tests first for new features (unit or integration tests). Use `tdd-guide` agent where helpful.
- Minimum test coverage target: 80% (see global testing rules).
- Run tests locally:
  - `npm test` — unit tests
  - `npm run test:cov` — coverage
  - `npm run test:e2e` — e2e tests (if present)
- Mock database repositories in unit tests with jest mocks (see `db.service.spec.ts`).

---

## Logging & observability

- File-based logs written to `logs/` (combined, error, stats). Do not add external logging services without an opt-in.
- HTTP requests are logged by `LoggingInterceptor` (applied globally) — see [src/main.ts:12-14](src/main.ts#L12-L14) and the interceptor file.

---

## Development workflow

- Local dev: `npm run start:dev` (the repo's start:dev runs Nest with --port 8080 per package.json script)
- Build: `npm run build` (Nest build)
- Lint: `npm run lint`
- Tests: `npm test` / `npm run test:cov`

Git & commit rules (follow project/global git-workflow):

- Commit message format: `<type>: <description>` (types: feat, fix, refactor, docs, test, chore, perf, ci)
- Do NOT push or force-push without explicit permission. Create branches per feature.
- When creating PRs: include test plan and run `git diff main...HEAD` to summarize changes.

---

## Agent recommendations (Claude Code)

When working programmatically with agents or automations, use the following specialized agents:

- planner: Use before implementing non-trivial features. Produce a short plan and request approval (ExitPlanMode).
- tdd-guide: Enforce write-tests-first workflow for new features and bug fixes.
- code-reviewer: Run after making changes to catch security and correctness issues.
- build-error-resolver: Use only if the build/test workflow fails and requires surgical fixes.
- security-reviewer: Run before merging changes that touch auth, user data, or secrets.

Parallelize agents where tasks are independent (e.g., run security-reviewer and code-reviewer in parallel after implementing changes).

---

## Files you may need to edit during common tasks

- Change port / CORS / global pipes: [src/main.ts:21-28](src/main.ts#L21-L28)
- JWT implementation: [src/modules/jwt/jwt.service.ts](src/modules/jwt/jwt.service.ts)
- Auth business logic: [src/modules/auth/auth.service.ts](src/modules/auth/auth.service.ts)
- User model: [src/modules/common/entities/user.entity.ts](src/modules/common/entities/user.entity.ts)
- DB wiring: [src/modules/db/db.service.ts](src/modules/db/db.service.ts)

---

## Notes for future sessions

- If asked to add features that change database shape, create a migration or document the change and prefer `synchronize: false` in production. For local experimentation `synchronize: true` is acceptable.
- When requested to modify logging or add telemetry, keep default file-based logs and do not add external services without explicit consent.
- If updating auth behavior (token TTLs, refresh rotation), ensure tests cover replay and invalid token paths.
