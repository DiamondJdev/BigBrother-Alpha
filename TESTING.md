Quick local testing for the agent (3 commands)

Prereqs: Docker running and you have permission to use it. Node.js installed (v18+).

1) Build sandbox image (if you don't already have one available):
   docker build -t bigbrother-sandbox .backend_archive/sandbox -f .backend_archive/sandbox/Dockerfile.sandbox

2) Install dependencies:
   npm install

3) Run the example test script (uses ts-node):
   npx ts-node --transpile-only examples/run_test.ts

What to expect:
- The script creates an in-memory TestRun and launches the orchestrator.
- Look in storage/artifacts/tenant-test/<run-id>/ for saved artifacts (installer, logs, metrics).

Notes:
- The example uses a dummy MZ header buffer as the installer. For a full run, replace the installerBuffer in examples/run_test.ts with a real .exe file read via fs.readFile.
- If Docker or the sandbox image is missing, the process will log errors about connecting to Docker or missing image.
- The agent uses an in-memory Prisma shim (no DB required). Artifacts are still written to disk.
