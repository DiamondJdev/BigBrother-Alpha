"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamToBuffer = streamToBuffer;
exports.demuxDockerStream = demuxDockerStream;
exports.sleep = sleep;
/**
 * Convert a readable stream to a Buffer
 */
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}
/**
 * Demultiplex Docker's multiplexed stream (stdout/stderr combined).
 * Docker multiplexes stdout and stderr into a single stream with 8-byte headers:
 *   [type(1 byte)][0][0][0][size(4 bytes big-endian)][payload]
 *   type: 0=stdin, 1=stdout, 2=stderr
 */
async function demuxDockerStream(stream) {
    const stdoutChunks = [];
    const stderrChunks = [];
    return new Promise((resolve, reject) => {
        let buffer = Buffer.alloc(0);
        stream.on('data', (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);
            while (buffer.length >= 8) {
                const type = buffer[0];
                const size = buffer.readUInt32BE(4);
                if (buffer.length < 8 + size)
                    break; // need more data
                const payload = buffer.subarray(8, 8 + size);
                buffer = buffer.subarray(8 + size);
                if (type === 1) {
                    stdoutChunks.push(payload);
                }
                else if (type === 2) {
                    stderrChunks.push(payload);
                }
            }
        });
        stream.on('end', () => {
            resolve({
                stdout: Buffer.concat(stdoutChunks).toString('utf-8'),
                stderr: Buffer.concat(stderrChunks).toString('utf-8'),
            });
        });
        stream.on('error', reject);
    });
}
/**
 * Helper to delay execution
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=stream.js.map