import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  private redactSensitiveFields(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;

    const sensitiveKeys = [
      'password',
      'refreshToken',
      'token',
      'authorization',
      'cookie',
      'secret',
      'keySecret',
      'cvv',
      'cardNumber',
    ];

    if (Array.isArray(obj)) {
      return obj.map((item) => this.redactSensitiveFields(item));
    }

    const cleaned: Record<string, any> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s.toLowerCase()))) {
        cleaned[key] = '[REDACTED]';
      } else if (val && typeof val === 'object') {
        cleaned[key] = this.redactSensitiveFields(val);
      } else {
        cleaned[key] = val;
      }
    }
    return cleaned;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();

    const { method, originalUrl, ip } = req;
    const correlationId = req.correlationId || 'none';
    const userId = (req as any).user?.id || 'anonymous';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const duration = Date.now() - startTime;
          const statusCode = res.statusCode;

          this.logger.log({
            message: `${method} ${originalUrl} ${statusCode} +${duration}ms`,
            correlationId,
            userId,
            ip,
            method,
            path: originalUrl,
            statusCode,
            durationMs: duration,
          });
        },
        error: (err: any) => {
          const duration = Date.now() - startTime;
          const statusCode = err.status || 500;

          this.logger.error({
            message: `${method} ${originalUrl} ${statusCode} +${duration}ms - ${err.message}`,
            correlationId,
            userId,
            ip,
            method,
            path: originalUrl,
            statusCode,
            durationMs: duration,
            error: err.name,
          });
        },
      })
    );
  }
}
