const prisma = require('./lib/prisma').prisma;
const orchestrator = require('./services/orchestrator.service');
const { v4: uuidv4 } = require('uuid');

async function startTestRun(options) {
  const { tenantId, softwareId, sandboxType = 'WINE_LINUX', runReason, idempotencyKey, installerBuffer } = options;

  const testRun = await prisma.testRun.create({
    data: {
      tenantId,
      softwareId,
      sandboxType,
      runReason: runReason || null,
      idempotencyKey: idempotencyKey || null,
    },
  });

  // Fire-and-forget orchestration
  orchestrator.orchestrate(testRun.id, tenantId, installerBuffer).catch((err) => {
    console.error('Orchestration failed unexpectedly', err);
  });

  return {
    id: testRun.id,
    status: testRun.status,
    created_at: testRun.createdAt ? testRun.createdAt.toISOString() : new Date().toISOString(),
  };
}

module.exports = { startTestRun };
