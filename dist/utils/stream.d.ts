import { Readable } from 'node:stream';
/**
 * Convert a readable stream to a Buffer
 */
export declare function streamToBuffer(stream: Readable): Promise<Buffer>;
/**
 * Demultiplex Docker's multiplexed stream (stdout/stderr combined).
 * Docker multiplexes stdout and stderr into a single stream with 8-byte headers:
 *   [type(1 byte)][0][0][0][size(4 bytes big-endian)][payload]
 *   type: 0=stdin, 1=stdout, 2=stderr
 */
export declare function demuxDockerStream(stream: Readable): Promise<{
    stdout: string;
    stderr: string;
}>;
/**
 * Helper to delay execution
 */
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=stream.d.ts.map