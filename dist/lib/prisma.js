// In-memory shim for Prisma client (dist runtime)
// Provides minimal prisma API used by orchestrator and services.
const { randomUUID } = require('crypto');

const testRuns = new Map();
const artifacts = new Map();

exports.prisma = {
  testRun: {
    create: async ({ data }) => {
      const id = randomUUID();
      const now = new Date();
      const tr = Object.assign({
        id,
        tenantId: data.tenantId,
        softwareId: data.softwareId,
        status: data.status || 'PENDING',
        sandboxType: data.sandboxType || 'WINE_LINUX',
        runReason: data.runReason || null,
        attemptNumber: data.attemptNumber || 1,
        idempotencyKey: data.idempotencyKey || null,
        startedAt: data.startedAt || null,
        completedAt: data.completedAt || null,
        createdAt: now,
        updatedAt: now,
        artifacts: [],
      }, data);
      testRuns.set(id, tr);
      return tr;
    },
    findUnique: async ({ where }) => {
      if (!where) return null;
      if (where.id) return testRuns.get(where.id) || null;
      if (where.idempotencyKey) {
        for (const tr of testRuns.values()) {
          if (tr.idempotencyKey === where.idempotencyKey) return tr;
        }
      }
      return null;
    },
    findMany: async ({ where = {}, skip = 0, take = 20 }) => {
      let arr = Array.from(testRuns.values());
      if (where.tenantId) arr = arr.filter((r) => r.tenantId === where.tenantId);
      if (where.softwareId) arr = arr.filter((r) => r.softwareId === where.softwareId);
      if (where.status) arr = arr.filter((r) => r.status === where.status);
      arr.sort((a, b) => b.createdAt - a.createdAt);
      return arr.slice(skip, skip + take);
    },
    count: async ({ where = {} } = {}) => {
      let arr = Array.from(testRuns.values());
      if (where.tenantId) arr = arr.filter((r) => r.tenantId === where.tenantId);
      if (where.softwareId) arr = arr.filter((r) => r.softwareId === where.softwareId);
      if (where.status) arr = arr.filter((r) => r.status === where.status);
      return arr.length;
    },
    update: async ({ where, data }) => {
      const tr = testRuns.get(where.id);
      if (!tr) throw new Error('TestRun not found');
      Object.assign(tr, data);
      tr.updatedAt = new Date();
      testRuns.set(tr.id, tr);
      return tr;
    },
  },
  testArtifact: {
    create: async ({ data }) => {
      const id = randomUUID();
      const now = new Date();
      const art = {
        id,
        tenantId: data.tenantId,
        testRunId: data.testRunId,
        artifactType: data.artifactType,
        objectKey: data.objectKey,
        contentHash: data.contentHash,
        installerByteSize: data.installerByteSize,
        storageClass: data.storageClass,
        createdAt: now,
      };
      artifacts.set(id, art);
      const tr = testRuns.get(data.testRunId);
      if (tr) {
        tr.artifacts = tr.artifacts || [];
        tr.artifacts.push(art);
      }
      return art;
    },
    findUnique: async ({ where }) => {
      if (where.id) return artifacts.get(where.id) || null;
      return null;
    },
  },
};

exports.disconnectPrisma = async function () { /* no-op */ }
