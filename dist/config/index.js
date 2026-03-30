"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const envalid_1 = require("envalid");
exports.config = (0, envalid_1.cleanEnv)(process.env, {
    // Database
    DATABASE_URL: (0, envalid_1.str)({
        desc: 'PostgreSQL connection string',
        default: 'postgresql://bigbrother:bigbrother@localhost:5432/bigbrother',
    }),
    // Server
    PORT: (0, envalid_1.port)({ default: 3000 }),
    LOG_LEVEL: (0, envalid_1.str)({
        choices: ['fatal', 'error', 'warn', 'info', 'debug', 'trace'],
        default: 'info',
    }),
    // Docker
    SANDBOX_IMAGE_NAME: (0, envalid_1.str)({ default: 'bigbrother-sandbox' }),
    SANDBOX_TIMEOUT_MS: (0, envalid_1.num)({ default: 300000, desc: 'Max time for installer execution (ms)' }),
    // Upload
    MAX_UPLOAD_SIZE_MB: (0, envalid_1.num)({ default: 500 }),
    // Storage
    ARTIFACT_STORAGE_PATH: (0, envalid_1.str)({ default: './storage/artifacts' }),
});
//# sourceMappingURL=index.js.map