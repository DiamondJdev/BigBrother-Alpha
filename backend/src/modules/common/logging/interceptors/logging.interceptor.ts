import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import type { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import type { Request, Response } from "express";
import { LoggerService } from "../services/logger.service";
import type { AuthenticatedRequest } from "../../AuthenticatedRequest";

interface HttpError extends Error {
  status?: number;
  stack?: string;
}

interface ResponseWithStatusCode extends Response {
  statusCode: number;
}

type RequestWithUser = Request & Partial<AuthenticatedRequest>;

@Injectable()
export class LoggingInterceptor implements NestInterceptor<unknown, unknown> {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const response = context
      .switchToHttp()
      .getResponse<ResponseWithStatusCode>();
    const { method, url, user } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;
          const userId = user?.id;

          this.logger.logRequest(method, url, statusCode, duration, userId);
        },
        error: (error: HttpError) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;
          const userId = user?.id;

          this.logger.logRequest(method, url, statusCode, duration, userId);
          this.logger.error(
            `Error in ${method} ${url}: ${error.message}`,
            error.stack,
            "HTTP",
          );
        },
      }),
    );
  }
}
