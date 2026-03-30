"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeSha256 = computeSha256;
exports.computeSha256Prefixed = computeSha256Prefixed;
const node_crypto_1 = __importDefault(require("node:crypto"));
/**
 * Compute SHA-256 hash of a buffer
 */
function computeSha256(data) {
    return node_crypto_1.default.createHash('sha256').update(data).digest('hex');
}
/**
 * Compute SHA-256 hash with a "sha256:" prefix
 */
function computeSha256Prefixed(data) {
    return `sha256:${computeSha256(data)}`;
}
//# sourceMappingURL=hash.js.map