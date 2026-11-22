import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { randomUUID } from 'crypto';
import { ApiErrorResponse } from '@ecommerce/contracts';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId =
      (request.headers['x-request-id'] as string) ||
      `req_${randomUUID().slice(0, 8)}`;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred. Please try again later.';
    let details: Array<{ field: string; issue: string }> | undefined;

    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      code = 'VALIDATION_ERROR';
      message = 'Invalid request parameters or payload';
      const zodError = exception.getZodError();
      if (zodError && 'issues' in zodError) {
        details = (zodError as ZodError).issues.map((issue) => ({
          field: issue.path.join('.'),
          issue: issue.message,
        }));
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resObj = exceptionResponse as Record<string, unknown>;
        message = (resObj.message as string) || exception.message;
        code = (resObj.code as string) || this.getDefaultCodeForStatus(status);
        if (Array.isArray(resObj.message)) {
          details = resObj.message.map((msg: string) => ({
            field: 'request',
            issue: msg,
          }));
          message = 'Validation failed';
        }
      }
    } else if (this.isPrismaError(exception)) {
      const prismaError = exception as { code?: string; meta?: { target?: string[] } };
      if (prismaError.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        code = 'RESOURCE_CONFLICT';
        const target = prismaError.meta?.target ? ` on field: ${prismaError.meta.target.join(', ')}` : '';
        message = `A unique constraint was violated${target}.`;
      } else if (prismaError.code === 'P2025') {
        status = HttpStatus.NOT_FOUND;
        code = 'NOT_FOUND';
        message = 'The requested resource could not be found.';
      }
    }

    // Log the error with request ID
    this.logger.error(
      `[${requestId}] ${request.method} ${request.url} - Status: ${status} - Error: ${message}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception)
    );

    const errorPayload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && details.length > 0 ? { details } : {}),
        requestId,
      },
    };

    response.status(status).json(errorPayload);
  }

  private isPrismaError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof (error as Record<string, unknown>).code === 'string' &&
      ((error as Record<string, unknown>).code as string).startsWith('P')
    );
  }

  private getDefaultCodeForStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'UNPROCESSABLE_ENTITY';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
