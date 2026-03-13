<div align="center">

# 🔍 BigBrother Alpha

**An enterprise-grade software evaluation and sandbox monitoring platform — safely test Windows application installs for security risks, behavioral anomalies, and policy compliance before they reach employee devices.**

[![NestJS](https://img.shields.io/badge/NestJS-11.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Jest](https://img.shields.io/badge/Jest-30.x-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io)

</div>

---

## 📋 Table of Contents

- [🌐 Project Overview](#-project-overview)
- [🏗️ Architecture](#️-architecture)
- [✨ Planned Functionality](#-planned-functionality)
- [📂 Repository Structure](#-repository-structure)
- [⚡ Getting Started](#-getting-started)
- [🔐 Environment Variables](#-environment-variables)
- [👥 Team](#-team)
- [🤝 How to Collaborate](#-how-to-collaborate)
- [🛣️ Development Tracks](#️-development-tracks)

---

## 🌐 Project Overview

BigBrother Alpha is a multi-tenant SaaS platform that allows enterprises to safely evaluate third-party software before permitting installation on employee devices. The platform orchestrates a structured pipeline that spans legal document analysis, isolated sandbox execution, security review, multi-role approval, and ongoing post-installation monitoring — all backed by immutable audit logs.

**The problem it solves:** Organizations cannot safely allow employees to install arbitrary software. BigBrother Alpha provides a controlled, auditable, and automated process so that every piece of software is reviewed from legal, security, and IT perspectives before reaching any device.

**Key design goals:**

- 🔒 **Security by default** — sandbox execution is isolated from API infrastructure; tenant data is never shared
- 🏢 **Multi-tenant** — each organization is a fully isolated tenant with row-level security
- 📋 **Audit-first** — every critical action is logged in an append-only audit trail
- 🤖 **LLM-assisted review** — legal document analysis and sandbox behavior summaries are AI-powered but human-approved

---

## 🏗️ Architecture

### System Components

```
┌───────────────────────────────────────────────────────────────────────┐
│                          Frontend Clients                              │
│           Admin Web Client          Desktop User Client               │
└──────────────────────────┬────────────────────────────────────────────┘
                           │ REST API
┌──────────────────────────▼────────────────────────────────────────────┐
│                        NestJS Backend API                              │
│  Auth · Tenant · User · Device · Evaluation · Approval · Audit        │
└────┬──────────┬─────────────────────┬──────────────────────┬──────────┘
     │          │                     │                      │
┌────▼───┐ ┌───▼────────┐ ┌──────────▼──────────┐ ┌────────▼────────┐
│  PostgreSQL │ │ Redis / RabbitMQ │ │ Object Storage (S3)  │ │  LLM Service    │
│  Database   │ │ Job Queue        │ │ Artifact Storage     │ │  Legal Analysis │
└────────┘ └────────────┘ └─────────────────────┘ └─────────────────┘
                │
┌───────────────▼───────────────────────────────────────────────────────┐
│               Isolated Sandbox Worker Fleet                            │
│   Windows Sandbox / Docker — Ephemeral, destroyed after each run      │
└───────────────────────────────────────────────────────────────────────┘
                │
┌───────────────▼───────────────────────────────────────────────────────┐
│                       Device Agent Service                             │
│       Post-installation behavioral monitoring on employee devices      │
└───────────────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Model

Every organization is an isolated tenant. The data hierarchy is:

```
Tenant
  └── Groups
        └── Users
              └── Devices
                    └── Software Evaluations
                              └── Test Runs
```

Row-level security in PostgreSQL ensures tenants can never access each other's data. Every tenant-scoped table includes a `tenant_id` column enforced by PostgreSQL RLS policies.

---

## ✨ Planned Functionality

The platform implements a 10-stage software evaluation lifecycle, plus post-installation monitoring, full audit logging, and an LLM-powered analysis pipeline.

### Stage 1 — Submission

Users submit a software request with:
- Vendor name, software version, vendor website
- Reason for request
- Optional links to license agreement and privacy policy

### Stage 2 — Legal Document Discovery

The platform attempts to locate and store links (not the documents themselves) to:
- License agreement
- Privacy policy
- Data processing agreement
- Data recovery plan

### Stage 3 — Automated Legal Analysis (LLM)

A backend worker fetches document content from discovered URLs, sanitizes and normalizes it, then sends it to an LLM with strict token budgets. The LLM extracts:
- Liability clauses
- Data ownership policies
- Age restrictions
- Telemetry collection clauses
- Risk summary and flagged concerns

Invalid or low-confidence LLM outputs are quarantined for manual review. Prompt-injection is mitigated by never trusting instructions embedded in source documents.

### Stage 4 — Human Legal Approval

Legal reviewers approve or reject the software based on extracted policy analysis, license terms, and organizational compliance rules.

### Stage 5 — Sandbox Test Queue

If legal approval is granted, the backend enqueues a sandbox test run. Only one active run per software per tenant is permitted at a time. Idempotency keys prevent duplicate submissions.

### Stage 6 — Isolated Sandbox Execution

The sandbox worker (separate from the API) executes the installer in an isolated environment (Windows Sandbox or Docker/Windows container). The API **never executes installers directly**. Workers are ephemeral and destroyed after each run. Collected artifacts include:
- Filesystem diff
- Registry diff
- Created services and scheduled tasks
- Outbound network connections
- Process tree
- Persistence attempts
- Sandbox logs

### Stage 7 — Security Review

Security reviewers analyze sandbox artifacts for suspicious behaviors:
- Unexpected persistence mechanisms
- Unusual registry modifications
- Unauthorized network communication
- Service or scheduled task creation

An LLM-powered behavioral analysis generates suspicious activity summaries.

### Stage 8 — Final Multi-Role Approval

Three roles must independently approve before software is cleared:
- **Legal** approval
- **Security** approval
- **IT Administration** approval

Approval records are append-only and immutable.

### Stage 9 — Deployment

Once all approvals are granted, users may install the approved software on their devices.

### Stage 10 — Post-Installation Monitoring

The device agent monitors installed software for a configurable period and reports:
- Unexpected persistence
- Unusual network calls
- Abnormal process activity

Alerts are generated for review when anomalies are detected.

### Additional Platform Features

| Feature | Description |
|---|---|
| 🔐 **JWT Auth** | Access + refresh token rotation; refresh tokens are bcrypt-hashed in the database |
| 🛡️ **RBAC** | Role-based access control: Tenant Owner, IT Admin, Security Reviewer, Legal Reviewer, Standard User |
| 🏢 **Multi-Tenant Isolation** | Row-level security via PostgreSQL; tenant context enforced per transaction |
| 🤖 **Device Authentication** | Rotating signed API tokens; devices registered and bound to a tenant |
| 📋 **Audit Logging** | Append-only audit logs for all critical actions (login, submissions, approvals, etc.) |
| 🔒 **Timing-Attack Prevention** | Constant-time hash comparison on auth endpoints to prevent username enumeration |
| ✅ **Input Validation** | Class-validator DTOs with strict whitelist and transform globally applied |
| 📝 **Structured Logging** | File-based multi-channel logs (combined, error, stats) with HTTP request interceptor |
| ❤️ **Health Checks** | `/` endpoint with live database connectivity probe |
| 🔌 **WebSocket Ready** | Socket.io pre-installed for real-time event streaming |
| 🧪 **Testing** | Jest unit tests with mocked repositories; coverage reports included |

---

## 📂 Repository Structure

```
BigBrother-Alpha/
├── README.md               ← You are here
└── backend/                ← NestJS REST API (primary active service)
    ├── .env.example        ← Environment variable template
    ├── src/
    │   ├── main.ts         ← Bootstrap: logger, pipes, CORS, port
    │   └── modules/
    │       ├── app.module.ts           ← Root module
    │       ├── auth/                   ← Login, register, token refresh
    │       ├── users/                  ← User CRUD (role-protected)
    │       ├── roles/                  ← Role management
    │       ├── db/                     ← TypeORM database abstraction
    │       ├── jwt/                    ← JWT token generation & validation
    │       ├── cache/                  ← Upstash Redis caching
    │       └── common/                 ← Shared entities, guards, logging, DTOs
    ├── test/               ← End-to-end tests
    ├── Design.md           ← Full architecture and data model design document
    ├── todo.md             ← Parallel development tracks and task backlog
    └── README.md           ← Backend-specific quickstart and API reference
```

> **Note:** The frontend clients (Admin Web Client, Desktop User Client) and Device Agent Service are planned components that do not yet have directories in this repository.

---

## ⚡ Getting Started

### Prerequisites

- **Node.js** ≥ 18 ([download](https://nodejs.org))
- **npm** ≥ 9
- **PostgreSQL** 16 ([download](https://www.postgresql.org/download/)) — running locally or via Docker
- **Upstash Redis** account — for caching ([upstash.com](https://upstash.com)) or a local Redis instance

### 1. Clone the Repository

```bash
git clone https://github.com/DiamondJdev/BigBrother-Alpha.git
cd BigBrother-Alpha
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your local values. See [Environment Variables](#-environment-variables) below for the full reference.

### 4. Set Up the Database

Ensure a PostgreSQL instance is running and create the target database:

```sql
CREATE DATABASE bigbrother_dev;
```

The backend uses TypeORM with `synchronize: true` in development, so the schema will be created automatically on first boot.

### 5. Start the Development Server

```bash
npm run start:dev
```

The server starts at **`http://localhost:8080`** in development mode.

### 6. Verify It's Working

```bash
curl http://localhost:8080/
```

Expected response:

```json
{
  "status": "ok",
  "database": { "status": "connected", "latencyMs": 12 },
  "backend": { "uptimeSeconds": 5, "version": "1.0.0", "mode": "development" },
  "timestamp": "2025-01-01T12:00:00.000Z"
}
```

### 7. Register Your First User

```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "adminuser", "password": "MyStr0ng!Password"}'
```

For a full API reference, see [backend/README.md](./backend/README.md).

---

## 🔐 Environment Variables

Create a `.env` file inside `backend/` based on `backend/.env.example`.

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5200` | HTTP server port |
| `DB_HOST` | No | `localhost` | PostgreSQL host |
| `DB_PORT` | No | `5432` | PostgreSQL port |
| `DB_USERNAME` | No | `postgres` | PostgreSQL username |
| `DB_PASSWORD` | **Yes** | — | PostgreSQL password |
| `DB_NAME` | No | `db_name` | PostgreSQL database name |
| `JWT_SECRET` | **Yes** | — | Secret key for signing JWT tokens |
| `JWT_ACCESS_EXP` | No | `15m` | Access token TTL (e.g., `15m`, `1h`) |
| `JWT_REFRESH_EXP` | No | `7d` | Refresh token TTL (e.g., `7d`, `30d`) |
| `UPSTASH_REDIS_REST_URL` | **Yes** | — | Upstash Redis REST endpoint URL |
| `UPSTASH_REDIS_REST_TOKEN` | **Yes** | — | Upstash Redis REST API token |
| `NODE_ENV` | No | `development` | Set to `production` to suppress console logs |

> ⚠️ **Never commit your `.env` file.** It is already included in `.gitignore`. Generate a strong JWT secret with: `openssl rand -hex 64`

---

## 👥 Team

Backend team:

| Role | Developer |
|---|---|
| Lead Developer | Cameron |
| Developer | Alex |
| Developer | Aaden |
| Developer | Felix |
| Developer | Noah |

---

## 🤝 How to Collaborate

### Branch & Commit Conventions

- Create a feature branch per task: `git checkout -b feat/my-feature`
- Commit message format: `<type>: <description>`
  - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`
  - Example: `feat: add device enrollment token rotation`
- Do **not** push directly to `main`. Always open a Pull Request.

### Pull Request Checklist

Before opening a PR:

- [ ] All existing tests pass: `npm test`
- [ ] Linting passes: `npm run lint`
- [ ] New functionality has unit tests
- [ ] No hardcoded secrets in code
- [ ] Environment variable changes are reflected in `.env.example`
- [ ] PR description includes a summary of changes and a test plan

### Running Tests

```bash
cd backend

# Unit tests
npm test

# Tests in watch mode
npm run test:watch

# Coverage report
npm run test:cov

# End-to-end tests
npm run test:e2e
```

### Linting and Building

```bash
cd backend

# Lint
npm run lint

# Build
npm run build
```

---

## 🛣️ Development Tracks

The backlog is organized into parallel tracks so multiple developers can work simultaneously. See [`backend/todo.md`](./backend/todo.md) for the full task list.

| Track | Goal | Status |
|---|---|---|
| **Track 0** | Security hardening (CORS, rate limiting, security headers) | 🔄 In Progress |
| **Track 1** | Core platform: job queue, object storage, config validation | ⬜ Planned |
| **Track 2** | Multi-tenant isolation hardening and device auth | ⬜ Planned |
| **Track 3** | Sandbox worker pipeline and artifact storage | ⬜ Planned |
| **Track 4** | LLM integration, approval state machine, release gates | ⬜ Planned |

> Pick one track per developer or pair. Complete items top-to-bottom within your track. If blocked by a dependency on another track, mark it and move to the next unblocked item.

---

<div align="center">

Made with ❤️ by [Cameron Ginther](https://github.com/DiamondJdev) and contributors

</div>
