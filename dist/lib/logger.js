"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("../config");
exports.logger = (0, pino_1.default)({
    level: config_1.config.LOG_LEVEL,
    transport: config_1.config.isDev
        ? {
            target: 'pino/file',
            options: { destination: 1 }, // stdout
        }
        : undefined,
});
//# sourceMappingURL=logger.js.map