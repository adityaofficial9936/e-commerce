import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '@ecommerce/contracts';

@Injectable()
export class ResponseEnvelopeInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<T>> {
    const http = context.switchToHttp();
    const req = http.getRequest();

    // Do not wrap Swagger docs or OpenAPI JSON
    if (req.url && (req.url.startsWith('/docs') || req.url.endsWith('-json'))) {
      return next.handle();
    }

    return next.handle().pipe(
      map((result) => {
        // If response is already in ApiResponse format, return as is
        if (result && typeof result === 'object' && 'success' in result) {
          return result;
        }

        // Support paginated responses that return { items, meta } or { data, meta }
        if (result && typeof result === 'object' && ('items' in result || 'data' in result) && 'meta' in result) {
          return {
            success: true,
            data: result.items ?? result.data,
            meta: result.meta,
          };
        }

        return {
          success: true,
          data: result,
        };
      })
    );
  }
}
