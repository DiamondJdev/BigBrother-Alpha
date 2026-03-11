# Backend TODOs (Simplified for Junior Developers)

This file is a simple implementation guide for the backend team.
It is split into **5 parallel tracks** so multiple developers can work at the same time.

How to use this file:

- Pick one track per developer (or pair).
- Complete items top-to-bottom inside that track.
- If blocked by another track, mark it and switch to the next unblocked item.

---

## Track 0 — Security Vulnerabilities

Goal: Fix critical and high severity security issues identified in security review

### 0.1 Critical Security Fixes (Fix Immediately)

- [ ] **CRITICAL: Fix CORS Configuration**
  - Replace `app.enableCors({ origin: true, credentials: true })` in `src/main.ts:35`
  - Specify exact allowed origins: `origin: ['http://localhost:3000', 'https://yourdomain.com']`
  - **Impact:** Currently allows ALL domains access with credentials (complete CORS bypass)

- [x] **CRITICAL: Add Rate Limiting**
  - Install `@nestjs/throttler` package
  - Configure rate limiting in `main.ts` (e.g., 100 requests per 15 minutes)
  - Add stricter limits for auth endpoints (e.g., 5 login attempts per minute)
  - **Impact:** Currently vulnerable to brute force and DDoS attacks

- [ ] **CRITICAL: Add Security Headers**
  - Install `helmet` middleware
  - Configure in `main.ts` for XSS, clickjacking, MIME sniffing protection
  - **Impact:** Missing protection against common web attacks

### 0.2 High Priority Security Fixes

- [x] **Fix Username Enumeration**
  - Standardize auth logging in `src/modules/auth/auth.service.ts:51-54`
  - Ensure identical response times for "user not found" vs "wrong password"
  - Remove distinguishable debug logging patterns
  - **Impact:** Attackers can enumerate valid usernames

- [x] **Simplify Environment Configuration**
  - Consolidate environment file paths in `src/modules/app.module.ts:21`
  - Use single, clear environment file pattern
  - **Impact:** Configuration confusion, wrong secrets loaded

### 0.3 Medium Priority Security Fixes

- [x] **Fix Async File Operations**
  - Replace `fs.appendFileSync()` with async operations in `src/modules/common/logging/services/logger.service.ts:52,56`
  - **Impact:** Performance degradation under high load

- [ ] **Fix Timing Attack Vector**
  - Improve placeholder hash in `src/modules/auth/auth.service.ts:58-60`
  - Use proper bcrypt hash as placeholder
  - **Impact:** Timing-based user enumeration

### Security Verification Checklist

Before marking Track 0 complete, verify:

- [ ] CORS only allows specific trusted origins
- [x] Rate limiting active on all endpoints (test with rapid requests)
- [ ] Security headers present in responses (check with browser dev tools)
- [ ] Auth endpoints have identical response patterns/timing
- [x] All cookies marked as secure and httpOnly
- [x] No hardcoded secrets remain in codebase
- [x] No synchronous file operations in hot paths

**Priority:** This track should be worked on immediately and completed before any other development work.

---

## Track 1 — Core Platform Setup (can start now)

Goal: create the shared foundation needed by all other tracks.

### 1.1 Add queue + object storage

- [ ] Add queue service (Redis/RabbitMQ) and backend queue module
- [ ] Add object storage client module (S3-compatible)
- [ ] Add health checks for queue and object storage

Why this matters:

- Sandbox jobs and LLM analysis must run asynchronously.
- Artifacts must be stored outside the database.

Done means:

- Backend can enqueue a test job and read queue status.
- Backend can upload/download a test file to object storage.

### 1.2 Add config + secrets safety

- [ ] Add config schema validation (fail startup on missing required env vars)
- [ ] Move secrets to env/secret manager only (no hardcoded values)
- [ ] Add startup checks for JWT, DB, queue, and storage credentials

Why this matters:

- Prevents broken deployments and secret leaks.

Done means:

- App refuses to boot when critical secrets are missing.
- No secret values are present in code or example defaults.

### 1.3 Add logs + metrics basics

- [ ] Standardize logs with fields: request_id, tenant_id, user/device id
- [ ] Add basic metrics: queue depth, job failures, run duration
- [ ] Add request-to-worker correlation id

Why this matters:

- Required for debugging production incidents.

Done means:

- One request can be traced from API to queue to worker using one ID.

---

## Track 2 — Multi-Tenant and Auth Security (can start now)

Goal: ensure tenant data cannot leak and device auth is safe.

### 2.1 Harden tenant isolation

- [ ] Enforce tenant context per transaction (not shared session state)
- [ ] Add DB wrapper that throws if tenant_id is missing
- [ ] Reset tenant context on pooled connection release
- [ ] Verify every tenant-scoped table has non-null tenant_id

Why this matters:

- Prevents cross-tenant data access.

Done means:

- Attempting a query without tenant context fails closed.
- Automated tests prove tenant A cannot read tenant B data.

### 2.2 Harden device enrollment and token flow

- [ ] Make enrollment tokens single-use
- [ ] Add short enrollment token TTL (minutes)
- [ ] Bind enrollment token to tenant + intended registration context
- [ ] Add replay protection for device tokens (jti/nonce or equivalent)
- [ ] Validate device header identity against token claims

Why this matters:

- Stops token reuse and rogue device registration.

Done means:

- Reused enrollment token is rejected.
- Stolen/replayed token is detected and denied.

---

## Track 3 — Sandbox + Artifact Pipeline (depends on Track 1 queue/storage)

Goal: run software tests safely outside the API and store artifacts correctly.

### 3.1 Build queue-driven sandbox workflow

- [ ] API only enqueues sandbox jobs (no installer execution inside API)
- [ ] Add idempotency key support for run requests
- [ ] Enforce one ACTIVE run per software per tenant
- [ ] Allow multiple historical runs (retry/rescan/new version)

Why this matters:

- Keeps API stable and prevents duplicate work.

Done means:

- Repeating same run request with same idempotency key does not duplicate jobs.
- System blocks second active run but allows future retry runs.

### 3.2 Build isolated worker execution

- [ ] Worker service consumes jobs and runs installers in isolated runtime
- [ ] Worker is ephemeral (destroyed after each run)
- [ ] Restrict worker network and host access
- [ ] Worker uploads artifacts directly to object storage

Why this matters:

- Unknown installers are high risk and must not run with API privileges.

Done means:

- API process never executes installer code.
- Worker can run job, upload artifacts, and exit cleanly.

### 3.3 Refactor artifact data model

- [ ] Store only artifact metadata in DB (no large raw payloads)
- [ ] Add metadata fields: tenant_id, object_key, content_sha256, byte_size, compression
- [ ] Add secure artifact download flow (signed URLs)
- [ ] Add retention/lifecycle cleanup jobs

Why this matters:

- Keeps DB small and scales storage cost predictably.

Done means:

- DB stores metadata only.
- Artifact binary/text content lives in object storage.

---

## Track 4 — LLM + Workflow Integrity + Release Safety (depends on Tracks 1–3)

Goal: make approval logic deterministic and LLM integration safe.

### 4.1 Secure LLM legal analysis pipeline

- [ ] Fetch legal docs in worker, sanitize content, and enforce size limits
- [ ] Send sanitized text to LLM (not raw URL)
- [ ] Validate LLM response with strict schema
- [ ] Quarantine invalid or low-confidence outputs for manual review
- [ ] Add per-tenant token/cost budget controls

Why this matters:

- Prevents prompt-injection issues and uncontrolled model cost.

Done means:

- Invalid LLM output never reaches final approval state.
- Every LLM request is budget-limited and logged.

### 4.2 Enforce approval state machine

- [ ] Define explicit states and allowed transitions for software evaluations
- [ ] Require Legal + Security + IT approvals before final approval
- [ ] Prevent transition bypasses (for example: deploy before approvals)
- [ ] Add concurrency protections for parallel approvals

Why this matters:

- Prevents inconsistent states and approval bypass bugs.

Done means:

- Invalid state transition requests are rejected with clear errors.
- Concurrent approval submissions do not corrupt state.

### 4.3 Final test and release gates

- [ ] Add unit tests for tenant wrapper, idempotency, state transitions, LLM validation
- [ ] Add integration tests for API → queue → worker → storage path
- [ ] Add security tests for cross-tenant access and token replay
- [ ] Add release checklist gate in CI (must pass before merge/release)

Why this matters:

- Ensures reliability before production rollout.

Done means:

- CI blocks release when critical suites fail.

---

## Final Definition of Done

- [ ] Tenant isolation verified by automated tests
- [ ] API never executes installers directly
- [ ] Artifacts are in object storage; DB holds metadata only
- [ ] LLM pipeline uses sanitized input + schema-validated output
- [ ] One-active-run + idempotency behavior is enforced
- [ ] CI release gates pass for security and workflow integrity
