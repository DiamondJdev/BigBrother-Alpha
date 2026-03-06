# Backend Design Document

Software Evaluation and Sandbox Monitoring Platform
NestJS Backend Architecture

---

# 1. Overview

The backend service manages the lifecycle of software approval within enterprise tenants. The platform allows organizations to evaluate software before allowing installation on employee devices.

The backend is responsible for:

• managing tenants, groups, users, and devices
• tracking software submissions and evaluation workflows
• coordinating sandbox test runs
• storing and analyzing test artifacts
• managing approval workflows
• maintaining immutable audit logs
• monitoring post installation behavior from device agents

The backend is implemented using **NestJS with PostgreSQL** and follows a **multi tenant SaaS architecture using row level tenancy**.

Client systems interacting with the backend:

• Web admin client
• Local desktop client
• Device agent service

Communication occurs exclusively through a **REST API**.

---

# 2. High Level Architecture

System Components

Frontend Clients
• Admin Web Client
• Desktop User Client

Device Systems
• Local Agent Service
• Sandbox Execution Environment

Backend Services
• NestJS API
• Artifact Storage Layer
• Approval Workflow Engine
• LLM Integration Service
• Job Queue and Workflow Orchestrator
• Sandbox Executor Worker Fleet (isolated)

Infrastructure
• Cloudflare hosting
• PostgreSQL database
• Object storage (required)
• Message queue (Redis/RabbitMQ)
• Ephemeral sandbox compute pool

---

# 3. Core Backend Responsibilities

The backend is responsible for the following domains.

Identity and Tenancy
• tenant creation and management
• user authentication
• group based access control
• row level tenant isolation

Device Management
• device registration
• device ownership mapping
• rotating device authentication tokens
• device activity tracking

Software Evaluation Lifecycle
• software request submission
• legal document discovery
• automated document analysis
• approval workflows
• sandbox test orchestration
• final software approval

Artifact Storage
• sandbox logs
• filesystem diffs
• registry diffs
• network activity
• process tree data

Monitoring
• post installation monitoring reports
• anomaly detection triggers

Audit and Compliance
• immutable audit logs
• approval records
• tenant exportable reports

---

# 4. Multi Tenant Model

Each organization operates as an isolated tenant.

Hierarchy

Tenant
→ Groups
→ Users
→ Devices
→ Software Evaluations
→ Test Runs

Design Principles

• users belong to a single tenant
• devices belong to users but may be shared
• tenants cannot access data from other tenants
• row level security enforces tenant isolation

Row Level Security Model

All primary tables include:

tenant_id

PostgreSQL row level policies enforce isolation.

Example

```SQL
CREATE POLICY tenant_isolation_policy
ON software_evaluations
USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

The NestJS request context sets the tenant identifier for each request.

Implementation Requirements (critical)

• tenant context must be set per transaction, not as unscoped session state
• every pooled connection must reset tenant context on release
• all DB access must run through a tenant context wrapper that fails closed when tenant_id is missing
• all primary and join tables must include tenant_id where data is tenant scoped

---

# 5. Identity and Authentication

User Authentication

Authentication method

• email and password
• JWT session tokens

JWT Structure

```text
{
  user_id
  tenant_id
  role
  group_ids
  exp
}
```

User Roles

• Tenant Owner
• IT Admin
• Security Reviewer
• Legal Reviewer
• Standard User

Authorization is enforced through **RBAC guards in NestJS**.

---

# 6. Device Authentication

Devices interact through the **agent service**.

Device Identity Model

Each registered device contains:

• device_id
• hostname
• os_version
• registered_user
• tenant_id

Authentication Method

Industry standard approach:

**Rotating signed API tokens**

Workflow

1 Device registered by admin
2 Device receives enrollment token
3 Agent exchanges token for device credentials
4 Backend issues rotating access tokens

Device Request Headers

```HTTP HEADER
Authorization: Bearer DEVICE_TOKEN
X-Device-ID: uuid
```

Device tokens are rotated periodically.

---

# 7. Software Evaluation Workflow

Software evaluation follows a structured workflow.

Stage 1
Submission

Users submit:

• vendor name
• software version or latest
• vendor website
• reason for request

Optional links

• license agreement
• privacy policy

---

Stage 2
Legal Document Discovery

The platform attempts to locate:

• license agreement
• privacy policy
• data processing agreement
• data recovery plan

Document links are stored but **not the documents themselves**.

---

Stage 3
Automated Legal Analysis

The backend does not send raw links directly to the LLM.

Secure flow

1 backend worker fetches document content from URLs
2 content is normalized and sanitized (HTML/script removal, size limits)
3 sanitized text is sent to the LLM with strict token budgets
4 LLM output is schema validated before persistence
5 invalid outputs are quarantined for manual review

The LLM extracts:

• liability clauses
• data ownership policies
• age restrictions
• telemetry collection clauses

The backend stores:

• summary analysis
• flagged risks

---

Stage 4
Human Legal Approval

Legal reviewers approve or reject based on:

• license terms
• data policies
• organization compliance rules

---

Stage 5
Sandbox Test Queue

If approved legally, the backend queues a **sandbox test run**.

Execution policy

• only one **active** test run per software per tenant at a time
• multiple historical runs are allowed for retries, rescans, and version changes
• idempotency keys prevent duplicate queue submissions

---

Stage 6
Sandbox Execution

Test environment options

• Windows Sandbox
• Docker container (Windows)

Execution model

• NestJS API only enqueues jobs and never executes installers
• sandbox execution runs in isolated worker infrastructure outside API runtime
• workers are ephemeral and destroyed after each run
• sandbox network and host permissions are tightly restricted

The sandbox worker executes the installer and collects behavioral artifacts.

---

Stage 7
Security Review

Security reviewers analyze sandbox results including:

• filesystem modifications
• registry changes
• persistence attempts
• scheduled tasks
• service creation
• network communication

LLM based analysis may generate suspicious behavior summaries.

---

Stage 8
Final Approval

Multiple approval roles must approve:

• Legal
• Security
• IT Administration

Approval records are immutable.

---

Stage 9
Deployment

Once approved, users may install the software on their devices.

---

Stage 10
Post Installation Monitoring

The agent service monitors installations for a configurable period.

The backend collects monitoring events such as:

• unexpected persistence
• unusual network calls
• abnormal process activity

Alerts are generated for review.

---

# 8. Test Run Data Model

Test runs store raw artifacts.

Artifacts Collected

• filesystem diff
• registry diff
• created services
• scheduled tasks
• outbound network connections
• process tree
• persistence attempts
• sandbox configuration data
• logs

Artifact storage model

• raw artifacts are stored in object storage
• database stores metadata only: object key, size, hash, artifact_type, created_at
• artifact uploads use streaming or pre-signed URLs from workers
• retention and lifecycle policies are enforced per tenant

---

# 9. Approval System

Approval workflow requires **multiple role approvals**.

Approval Types

• Legal Approval
• Security Approval
• IT Approval

Each approval record contains

```text
approval_id
software_id
approver_user_id
approval_type
decision
timestamp
comments
```

Approvals are **append only**.

---

# 10. Audit Logging

All critical actions generate audit events.

Audit Events

• user login
• user logout
• user deletion
• software submission
• approval decisions
• sandbox test initiation
• device activity

Audit logs are stored in an **append only audit table**.

Example structure

```text
audit_logs
---------
id
tenant_id
actor_user_id
event_type
target_entity
target_id
timestamp
metadata_json
```

Logs cannot be modified.

---

# 11. Database Schema (Simplified)

Tenants

```text
tenants
--------
id
name
created_at
```

Groups

```
groups
-------
id
tenant_id
name
```

Users

```text
users
-------
id
tenant_id
group_id
email
password_hash
role
created_at
```

Devices

```text
devices
--------
id
tenant_id
hostname
os_version
registered_user_id
device_token_hash
created_at
```

Software Evaluations

```
software_evaluations
id
tenant_id
vendor_name
version
website
status
submitted_by
created_at
```

Test Runs

```
test_runs
id
tenant_id
software_id
status
sandbox_type
run_reason
attempt_number
idempotency_key
started_at
completed_at
```

Artifacts

```
test_artifacts
id
tenant_id
test_run_id
artifact_type
object_key
content_sha256
byte_size
storage_class
compression
created_at
```

Approvals

```
approvals
id
software_id
approval_type
approved_by
decision
timestamp
```

Audit Logs

```
audit_logs
id
tenant_id
event_type
actor_id
target_id
metadata
timestamp
```

---

# 12. API Structure

REST API modules follow NestJS modular architecture.

Core Modules

Auth Module
Tenant Module
User Module
Group Module
Device Module
Software Evaluation Module
Test Run Module
Artifact Module
Approval Module
Audit Module
LLM Analysis Module

Example API Routes

Auth

```
POST /auth/login
POST /auth/logout
```

Devices

```
POST /devices/register
GET /devices
GET /devices/:id
```

Software Evaluation

```
POST /software/request
GET /software
GET /software/:id
```

Test Runs

```
POST /tests/run
GET /tests/:id
```

Approvals

```
POST /approvals/legal
POST /approvals/security
POST /approvals/it
```

---

# 13. LLM Integration

LLM services assist in two areas.

Legal Document Analysis

Input

• sanitized extracted document text
• document metadata (source URL, hash, retrieval timestamp)

Output

• clause extraction
• risk summary
• policy classification

Safety controls

• strict schema validation of model outputs
• token and cost budgets per request and per tenant
• prompt-injection resistant parsing pipeline (no instruction trust from source documents)
• fallback to manual review on low confidence or invalid output

Sandbox Behavior Analysis

Input

• artifact summaries

Output

• suspicious activity reports
• anomaly classification

LLM services run asynchronously to avoid blocking API requests.

---

# 14. Security Considerations

Tenant Isolation

• PostgreSQL row level security
• tenant ID enforced in all queries

Authentication

• JWT tokens with short expiration
• password hashing using Argon2

Device Security

• rotating device tokens
• agent authentication verification

Data Security

• encryption at rest
• secure audit logging

Sandbox Safety

• sandbox execution isolated from production systems

Threat Monitoring

• flagged suspicious behaviors stored for review

---

# 15. Cost Considerations

Largest cost drivers

Artifact Storage

Sandbox artifacts may grow rapidly.

Architecture stores artifacts in object storage with lifecycle rules:

• object storage
• compressed storage format
• tiered retention by artifact type and age

LLM Analysis

Cost depends on artifact size and document complexity.

Mitigation

• summarize artifacts before analysis
• use smaller models for initial classification

---

# 16. Future Enhancements

Cross Tenant Knowledge

Future system may allow:

• anonymized approval recommendations
• cross tenant risk scoring

Improved Device Enrollment

Self registration with enrollment tokens.

Cloud Sandbox

Centralized sandbox cluster for automated testing.

Artifact Storage Migration

Move artifacts from database to object storage.

Compliance Tools

SOC2 compatible audit exports.
