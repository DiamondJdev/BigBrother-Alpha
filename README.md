BigBrother — Agent Engine (Docker-based installer tester)
=========================================================

Overview
--------
This repository contains the "agent engine": a self-contained runtime that runs Windows installers inside a Docker sandbox, captures metrics and filesystem changes, and writes artifacts (installer copy, logs, metrics, file-diff) to disk. The agent is intentionally minimal and designed to be called by another backend service or run as a worker process.

This repository is agent-only by design: the HTTP server and full Prisma schema were archived and are not required for the agent to run. The agent uses an in-memory store by default so you can run and test locally without a Postgres database.

Quickstart (3 commands)
-----------------------
Run these from the project root:

1) Build the sandbox image (only once):

   docker build -t bigbrother-sandbox sandbox

2) Install Node dependencies (only once on this machine):

   npm install

3) Run the test example (runs the agent + sandbox):

   node examples/run_test.js

After the script completes, artifacts are in:

storage/artifacts/<tenant>/<test-run-id>/

Files of interest: README.md (this file), SUPER_SIMPLE_RUN.txt (very short commands), TESTING.md (longer notes).

How it works (components)
-------------------------
- Programmatic agent API
  - dist/agent.js: startTestRun(...) is the public entry you can call to create a run and launch orchestration. See dist/agent.js:1 for the entry implementation.

- Orchestration pipeline
  - dist/services/orchestrator.service.js: orchestrate(testRunId, tenantId, installerBuffer) runs the pipeline (PROVISIONING → PRE_METRICS → INSTALLING → POST_METRICS → ANALYZING → COMPLETED). See the main orchestrate function at dist/services/orchestrator.service.js:68.

- Sandbox image (test simulator)
  - sandbox/Dockerfile and sandbox/entrypoint.sh provide a lightweight sandbox used for testing. The entrypoint waits for /sandbox/installer.exe and then simulates an install (copying the file and writing a marker). See sandbox/entrypoint.sh:1.

- Artifacts and storage
  - Artifacts are written to the filesystem under storage/artifacts/<tenant>/<run-id> by dist/services/artifact.service.js.
  - Typical artifacts: installer.exe, stdout.log, stderr.log, metrics_report.json, file_diff_report.json.

- In-memory storage shim
  - dist/lib/prisma.js provides a small in-memory Prisma-like API so the agent can run without Postgres. Data is ephemeral (lost on restart).

Where to start in the code
--------------------------
- Agent entry: dist/agent.js (startTestRun). Example: dist/agent.js:1
- Orchestration: dist/services/orchestrator.service.js (orchestrate) — see line dist/services/orchestrator.service.js:68
- Sandbox: sandbox/Dockerfile and sandbox/entrypoint.sh (behavior) — sandbox/entrypoint.sh:1
- Example runner: examples/run_test.js (simple script that calls the agent and polls for completion)

Integrating with your backend
-----------------------------
You have two common integration patterns:

1) Direct import (same host / co-deployed):

   // Minimal example (Node.js)
   const agent = require('/path/to/repo/dist/agent');
   const fs = require('fs').promises;

   async function createRun() {
     const buf = await fs.readFile('/tmp/installer.exe');
     const res = await agent.startTestRun({
       tenantId: 'tenant-123',
       softwareId: 'software-abc',
       idempotencyKey: 'unique-key',
       installerBuffer: buf,
     });
     // res.id is the run id; poll or wait for completion as needed
   }

2) Queue/worker (decoupled):

   - Backend enqueues a job with installer location (object store) or binary payload.
   - A worker process consumes the queue and calls agent.startTestRun(...) for each job.
   - Worker posts results back to your backend via callback or writes to a shared store.

Notes about persistence
----------------------
- The default runtime uses an in-memory shim (dist/lib/prisma.js). If your backend needs durable records, restore Postgres + Prisma and replace the shim with Prisma client. The schema file was archived; to re-enable persistence you must:
  - Restore prisma/schema.prisma from .backend_archive (if available) or from your schema source
  - Run `npx prisma generate` and `npx prisma migrate dev` (or prisma db push) against a running Postgres instance

Testing and inspection
----------------------
- Run the Quickstart above to produce a test run using the provided lightweight sandbox.
- Files are written to storage/artifacts/<tenant>/<run-id>/.

Inspecting artifacts safely
--------------------------
Do NOT execute installer.exe on your host. Use these commands to inspect:

- List files:
  ls -la storage/artifacts/tenant-test/<run-id>

- Identify file type:
  file storage/artifacts/tenant-test/<run-id>/installer.exe

- Extract readable strings:
  strings storage/artifacts/tenant-test/<run-id>/installer.exe | head -n 200

- View hex header (confirms MZ):
  hexdump -C -n 64 storage/artifacts/tenant-test/<run-id>/installer.exe

- Compute SHA-256:
  shasum -a 256 storage/artifacts/tenant-test/<run-id>/installer.exe

- View JSON reports (pretty):
  jq . storage/artifacts/tenant-test/<run-id>/metrics_report.json

If you prefer a one-command helper, the repository includes scripts you can add; ask me and I will add a small inspect helper script to summarize artifacts.

Replacing the sandbox for real runs
----------------------------------
The current sandbox is a simulator for fast local testing. For real Windows installers you should provide a production sandbox image that includes Wine, Xvfb, and any required tooling (tcpdump if you want egress capture). To use your own image:

- Build or pull the image and make it available on the host as bigbrother-sandbox (or set config.SANDBOX_IMAGE_NAME to your image name).
- Ensure the image's entrypoint behaves as expected: either wait for installer to appear in /sandbox or accept mounts/arguments for the installer path.

Security notes
--------------
- The sandbox runs untrusted binaries — always run testers on isolated infrastructure.
- The agent mounts Docker and requires permission to start containers. Do not expose the docker socket to untrusted users.
- If you enable egress capture or add capabilities like NET_ADMIN, be aware this increases attack surface.

Troubleshooting
---------------
- "Cannot connect to Docker daemon": Start Docker Desktop or Colima (macOS) and ensure docker CLI works: docker run --rm hello-world
- Missing node modules: run npm install from repo root
- Container exits before installer copied: the sandbox entrypoint in this repo waits up to 30s for /sandbox/installer.exe; if you change the orchestrator lifecycle to start container after copying the file you avoid waiting inside the container.
- If orchestration fails, check container logs:
  docker ps -a --filter ancestor=bigbrother-sandbox
  docker logs <container-id>

Extending the agent (ideas)
---------------------------
- Persistence: add a pluggable storage adapter (Prisma/Postgres, file-based, or an HTTP callback) so the other backend can own run metadata.
- Artifacts: add support for uploading artifacts to S3-compatible storage and returning object keys instead of local file paths.
- Egress capture: add tcpdump support and a pipeline stage that summarizes outbound connections (requires extra capabilities in container HostConfig).

Files & locations (short)
-------------------------
- dist/agent.js — agent start API (dist/agent.js:1)
- dist/services/orchestrator.service.js — orchestration pipeline (dist/services/orchestrator.service.js:68)
- dist/lib/prisma.js — in-memory shim
- sandbox/Dockerfile, sandbox/entrypoint.sh — sandbox image and behavior
- examples/run_test.js — example runner to create a test run and poll completion
- storage/artifacts/ — produced artifacts
- SUPER_SIMPLE_RUN.txt — quick 3-step commands
- TESTING.md — longer troubleshooting notes

Contact / Next steps
--------------------
Tell me which of these you want me to do next and I’ll make it happen:
- Add an inspect_artifacts helper script that summarizes run artifacts
- Make persistence pluggable (in-memory by default, Postgres adapter optional)
- Add an npm script to run build + test in one step
- Replace the sandbox simulator with a Wine-enabled sandbox image (requires building a larger image)

License / Notes
---------------
This project is a test harness / agent for sandboxed installer execution. Use responsibly: do not run untrusted binaries on production hosts. The agent is designed to be embedded or called by another backend which handles job submission, persistence, and user-facing APIs.

