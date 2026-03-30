const fs = require('fs').promises;
const path = require('path');
const agent = require('../dist/agent');
const prisma = require('../dist/lib/prisma').prisma;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  console.log('Starting local agent test (JS runner)...');

  // Ensure storage path exists
  await fs.mkdir(path.join(process.cwd(), 'storage', 'artifacts'), { recursive: true });

  // Minimal dummy PE buffer (MZ header). Use a real installer for full testing.
  const dummy = Buffer.concat([Buffer.from([0x4d, 0x5a]), Buffer.alloc(1024)]);

  const res = await agent.startTestRun({
    tenantId: 'tenant-test',
    softwareId: 'software-test',
    idempotencyKey: 'test-run-1',
    installerBuffer: dummy,
  });

  console.log('Created test run:', res.id);

  // Poll status until finished
  let run = null;
  for (let i = 0; i < 60; i++) {
    await sleep(2000);
    run = await prisma.testRun.findUnique({ where: { id: res.id } });
    console.log(`[poll ${i}] status=${run?.status}`);
    if (!run) continue;
    if (['COMPLETED', 'FAILED', 'TIMED_OUT'].includes(run.status)) break;
  }

  console.log('Final run:', run);

  const artifactDir = path.join(process.cwd(), 'storage', 'artifacts', 'tenant-test', res.id);
  try {
    const list = await fs.readdir(artifactDir);
    console.log('Artifact files:', list);
  } catch (err) {
    console.warn('No artifact dir found or read error:', err.message || err);
  }
}

main().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
