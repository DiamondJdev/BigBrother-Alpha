import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export enum LogLevel {
	ERROR = 'ERROR',
	WARN = 'WARN',
	INFO = 'INFO',
	DEBUG = 'DEBUG',
}

interface LogEntry {
	timestamp: string;
	level: LogLevel;
	context?: string;
	message: string;
	metadata?: Record<string, unknown>;
}

interface WriteQueueItem {
	file: string;
	content: string;
	retries?: number;
}

@Injectable()
export class LoggerService implements NestLoggerService {
	private logDir: string;
	private errorLogFile: string;
	private combinedLogFile: string;
	private statsLogFile: string;
	private writeQueue: WriteQueueItem[] = [];
	private isProcessingQueue = false;
	private queueProcessingPromise: Promise<void> | null = null;

	// Performance optimization constants
	private readonly MAX_QUEUE_SIZE = 10000;
	private readonly MAX_RETRIES = 3;
	private readonly BATCH_SIZE = 10;
	private droppedLogsCount = 0;

	// Timestamp caching for performance
	private timestampCache: { time: number; iso: string } = { time: 0, iso: '' };

	// Backpressure handling
	private samplingRate = 1.0; // 1.0 = 100% (no sampling), 0.1 = 10%
	private lastBackpressureAdjustment = 0;
	
	constructor() {
		this.logDir = path.join(process.cwd(), 'logs');
		this.errorLogFile = path.join(this.logDir, 'error.log');
		this.combinedLogFile = path.join(this.logDir, 'combined.log');
		this.statsLogFile = path.join(this.logDir, 'stats.log');

		// Initialize async - don't block constructor
		this.ensureLogDirectory().catch(err =>
			console.error('Failed to create log directory:', err)
		);
	}
	
	private async ensureLogDirectory(): Promise<void> {
		try {
			await fs.access(this.logDir);
		} catch {
			await fs.mkdir(this.logDir, { recursive: true });
		}
	}

	private getTimestamp(): string {
		const now = Date.now();
		// Cache timestamp for up to 100ms to reduce Date object creation
		if (now - this.timestampCache.time > 100) {
			this.timestampCache = {
				time: now,
				iso: new Date(now).toISOString()
			};
		}
		return this.timestampCache.iso;
	}

	private adjustBackpressure(): void {
		const now = Date.now();
		const queueSize = this.writeQueue.length;

		// Only adjust every 1000ms to avoid thrashing
		if (now - this.lastBackpressureAdjustment < 1000) {
			return;
		}

		this.lastBackpressureAdjustment = now;

		if (queueSize > 5000) {
			// Severe backpressure - drop 90% of logs
			this.samplingRate = 0.1;
		} else if (queueSize > 2000) {
			// High backpressure - drop 70% of logs
			this.samplingRate = 0.3;
		} else if (queueSize > 500) {
			// Moderate backpressure - drop 50% of logs
			this.samplingRate = 0.5;
		} else if (queueSize < 100) {
			// Low backpressure - gradually restore full logging
			this.samplingRate = Math.min(1.0, this.samplingRate + 0.1);
		}
	}

	private shouldLogEntry(level: LogLevel): boolean {
		this.adjustBackpressure();

		// Always log errors regardless of backpressure
		if (level === LogLevel.ERROR) {
			return true;
		}

		// Apply sampling rate for other log levels
		return Math.random() < this.samplingRate;
	}

	private serializeMessage(message: any): string {
		if (typeof message === 'string') {
			return message;
		}

		if (typeof message === 'number' || typeof message === 'boolean') {
			return String(message);
		}

		if (message === null || message === undefined) {
			return String(message);
		}

		// For objects, use safer serialization
		try {
			return JSON.stringify(message);
		} catch {
			// Handle circular references and non-serializable objects
			try {
				return JSON.stringify(message, (key, value: unknown) => {
					if (typeof value === 'object' && value !== null) {
						// Simple circular reference detection
						if (this.seen && this.seen.has(value)) {
							return '[Circular]';
						}
						if (!this.seen) this.seen = new WeakSet();
						this.seen.add(value);
					}
					return value;
				});
			} catch {
				return '[Non-serializable Object]';
			} finally {
				this.seen = undefined;
			}
		}
	}

	private seen?: WeakSet<object>;
	
	private formatLogEntry(entry: LogEntry): string {
		const { timestamp, level, context, message, metadata } = entry;
		const contextStr = context ? `[${context}]` : '';
		const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : '';
		return `${timestamp} [${level}]${contextStr} ${message}${metadataStr}\n`;
	}

	private queueWrite(file: string, content: string): boolean {
		// Check queue size limit to prevent memory exhaustion
		if (this.writeQueue.length >= this.MAX_QUEUE_SIZE) {
			// Drop oldest entry to make room
			this.writeQueue.shift();
			this.droppedLogsCount++;

			// Log dropped count periodically to console (non-queued)
			if (this.droppedLogsCount % 100 === 0) {
				console.warn(`LoggerService: Dropped ${this.droppedLogsCount} log entries due to queue overflow`);
			}
		}

		this.writeQueue.push({ file, content, retries: 0 });

		// Start processing if not already running
		if (!this.isProcessingQueue) {
			void this.processWriteQueue();
		}

		return true;
	}

	private async processWriteQueue(): Promise<void> {
		// Prevent multiple queue processors from running concurrently
		if (this.queueProcessingPromise) {
			return this.queueProcessingPromise;
		}

		this.queueProcessingPromise = this.doProcessQueue();

		try {
			await this.queueProcessingPromise;
		} finally {
			this.queueProcessingPromise = null;
		}
	}

	private async doProcessQueue(): Promise<void> {
		this.isProcessingQueue = true;

		try {
			while (this.writeQueue.length > 0) {
				const batch = this.writeQueue.splice(0, this.BATCH_SIZE);

				// Group writes by file to minimize file handle operations
				const fileGroups = new Map<string, string>();

				for (const item of batch) {
					const existing = fileGroups.get(item.file) || '';
					fileGroups.set(item.file, existing + item.content);
				}

				// Write all grouped content to files concurrently
				const writePromises = Array.from(fileGroups.entries()).map(
					async ([file, content]) => {
						try {
							await fs.appendFile(file, content);
						} catch (error) {
							console.error(`Failed to write to log file ${file}:`, error);

							// Find items that failed and re-queue with retry limit
							for (const item of batch) {
								if (item.file === file) {
									const retries = (item.retries || 0) + 1;
									if (retries <= this.MAX_RETRIES) {
										this.writeQueue.unshift({ ...item, retries });
									} else {
										// Drop after max retries to prevent infinite loops
										console.error(`Dropping log entry after ${this.MAX_RETRIES} retries:`, item.content.substring(0, 100));
									}
								}
							}
						}
					}
				);

				await Promise.allSettled(writePromises);

				// Adaptive delay based on queue size for backpressure
				if (this.writeQueue.length > 1000) {
					await new Promise(resolve => setTimeout(resolve, 10));
				} else if (this.writeQueue.length > 100) {
					await new Promise(resolve => setTimeout(resolve, 1));
				}
			}
		} finally {
			this.isProcessingQueue = false;
		}
	}

	// Graceful shutdown method to flush remaining logs
	async flushLogs(): Promise<void> {
		if (this.queueProcessingPromise) {
			await this.queueProcessingPromise;
		}

		if (this.writeQueue.length > 0) {
			await this.processWriteQueue();
		}
	}
	
	private writeLog(entry: LogEntry): void {
		const formattedLog = this.formatLogEntry(entry);

		// Queue write to combined log
		this.queueWrite(this.combinedLogFile, formattedLog);

		// Queue write to error log if it's an error
		if (entry.level === LogLevel.ERROR) {
			this.queueWrite(this.errorLogFile, formattedLog);
		}

		// Also log to console in development
		if (process.env.NODE_ENV !== 'production') {
			const coloredLog = this.colorizeLog(entry);
			console.log(coloredLog);
		}
	}
	
	private colorizeLog(entry: LogEntry): string {
		const colors = {
			ERROR: '\x1b[31m', // Red
			WARN: '\x1b[33m',  // Yellow
			INFO: '\x1b[36m',  // Cyan
			DEBUG: '\x1b[37m', // White
		};
		const reset = '\x1b[0m';
		const color = colors[entry.level] || reset;
		return `${color}${this.formatLogEntry(entry).trim()}${reset}`;
	}
	
	log(message: any, context?: string): void {
		if (!this.shouldLogEntry(LogLevel.INFO)) {
			return;
		}

		this.writeLog({
			timestamp: this.getTimestamp(),
			level: LogLevel.INFO,
			context,
			message: this.serializeMessage(message),
		});
	}
	
	error(message: any, trace?: string, context?: string): void {
		// Always log errors - no backpressure filtering
		this.writeLog({
			timestamp: this.getTimestamp(),
			level: LogLevel.ERROR,
			context,
			message: this.serializeMessage(message),
			metadata: trace ? { trace } : undefined,
		});
	}
	
	warn(message: any, context?: string): void {
		// Always log warnings - no backpressure filtering
		this.writeLog({
			timestamp: this.getTimestamp(),
			level: LogLevel.WARN,
			context,
			message: this.serializeMessage(message),
		});
	}
	
	debug(message: any, context?: string): void {
		if (!this.shouldLogEntry(LogLevel.DEBUG)) {
			return;
		}

		this.writeLog({
			timestamp: this.getTimestamp(),
			level: LogLevel.DEBUG,
			context,
			message: this.serializeMessage(message),
		});
	}
	
	verbose(message: any, context?: string): void {
		this.log(message, context);
	}
	
	logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string): void {
		this.writeLog({
			timestamp: this.getTimestamp(),
			level: LogLevel.INFO,
			context: 'HTTP',
			message: `${method} ${url} ${statusCode}`,
			metadata: {
				duration: `${duration}ms`,
				userId: userId || 'anonymous',
			},
		});
	}
	
	logUserStats(action: string, userId: string, metadata?: Record<string, unknown>): void {
		const logEntry: LogEntry = {
			timestamp: this.getTimestamp(),
			level: LogLevel.INFO,
			context: 'UserStats',
			message: `User ${userId} - ${action}`,
			metadata,
		};

		// Queue write to stats log
		this.queueWrite(this.statsLogFile, this.formatLogEntry(logEntry));

		// Also write to combined log
		this.writeLog(logEntry);
	}
}
