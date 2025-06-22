/**
 * Error Handling HTTP Interceptor
 * Enterprise-level error management and user notification
 */

import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, delay } from 'rxjs/operators';

export interface ErrorContext {
  request: HttpRequest<any>;
  error: HttpErrorResponse;
  timestamp: Date;
  retryCount?: number;
}

export interface UserFriendlyError {
  title: string;
  message: string;
  actionRequired?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  code?: string;
  supportReference?: string;
}

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  private readonly retryableStatusCodes = [408, 429, 500, 502, 503, 504];
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      retry({
        count: this.shouldRetry(request) ? this.maxRetries : 0,
        delay: (error: HttpErrorResponse, retryIndex: number) => {
          if (this.isRetryableError(error)) {
            const delayTime = this.calculateRetryDelay(retryIndex);
            console.log(`Retrying request to ${request.url} in ${delayTime}ms (attempt ${retryIndex + 1})`);
            return delay(delayTime);
          }
          throw error;
        }
      }),
      catchError((error: HttpErrorResponse) => {
        const errorContext: ErrorContext = {
          request,
          error,
          timestamp: new Date()
        };

        const userFriendlyError = this.transformError(errorContext);
        this.logError(errorContext, userFriendlyError);
        
        // Enhance error object with user-friendly information
        const enhancedError = {
          ...error,
          userFriendly: userFriendlyError,
          context: errorContext
        };

        return throwError(enhancedError);
      })
    );
  }

  private shouldRetry(request: HttpRequest<any>): boolean {
    // Only retry safe HTTP methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    return safeMethods.includes(request.method.toUpperCase());
  }

  private isRetryableError(error: HttpErrorResponse): boolean {
    return this.retryableStatusCodes.includes(error.status) ||
           error.status === 0; // Network errors
  }

  private calculateRetryDelay(retryIndex: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelay * Math.pow(2, retryIndex);
    const jitter = Math.random() * 1000;
    return baseDelay + jitter;
  }

  private transformError(context: ErrorContext): UserFriendlyError {
    const { error, request } = context;

    switch (error.status) {
      case 0:
        return {
          title: 'Connection Problem',
          message: 'Unable to connect to the server. Please check your internet connection and try again.',
          actionRequired: 'check_connection',
          severity: 'error',
          code: 'NETWORK_ERROR'
        };

      case 400:
        return {
          title: 'Invalid Request',
          message: this.getBadRequestMessage(error),
          actionRequired: 'correct_input',
          severity: 'warning',
          code: 'BAD_REQUEST'
        };

      case 401:
        return {
          title: 'Authentication Required',
          message: 'Your session has expired. Please log in again.',
          actionRequired: 'login_required',
          severity: 'warning',
          code: 'UNAUTHORIZED'
        };

      case 403:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
          actionRequired: 'contact_administrator',
          severity: 'warning',
          code: 'FORBIDDEN'
        };

      case 404:
        return {
          title: 'Not Found',
          message: this.getNotFoundMessage(request.url),
          actionRequired: 'verify_resource',
          severity: 'warning',
          code: 'NOT_FOUND'
        };

      case 409:
        return {
          title: 'Conflict',
          message: 'The resource you are trying to modify has been changed by another user. Please refresh and try again.',
          actionRequired: 'refresh_data',
          severity: 'warning',
          code: 'CONFLICT'
        };

      case 422:
        return {
          title: 'Validation Error',
          message: this.getValidationMessage(error),
          actionRequired: 'correct_input',
          severity: 'warning',
          code: 'VALIDATION_ERROR'
        };

      case 429:
        return {
          title: 'Too Many Requests',
          message: 'You are making requests too quickly. Please wait a moment and try again.',
          actionRequired: 'wait_and_retry',
          severity: 'warning',
          code: 'RATE_LIMITED'
        };

      case 500:
        return {
          title: 'Server Error',
          message: 'An unexpected error occurred on the server. Our team has been notified.',
          actionRequired: 'try_again_later',
          severity: 'error',
          code: 'INTERNAL_SERVER_ERROR',
          supportReference: this.generateSupportReference()
        };

      case 502:
      case 503:
      case 504:
        return {
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable. Please try again in a few minutes.',
          actionRequired: 'try_again_later',
          severity: 'error',
          code: 'SERVICE_UNAVAILABLE'
        };

      default:
        return {
          title: 'Unexpected Error',
          message: 'An unexpected error occurred. If this persists, please contact support.',
          actionRequired: 'contact_support',
          severity: 'error',
          code: 'UNKNOWN_ERROR',
          supportReference: this.generateSupportReference()
        };
    }
  }

  private getBadRequestMessage(error: HttpErrorResponse): string {
    if (error.error?.message) {
      return error.error.message;
    }
    
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      return error.error.errors.join(', ');
    }

    return 'The request contains invalid data. Please check your input and try again.';
  }

  private getNotFoundMessage(url: string): string {
    if (url.includes('/assets/')) {
      return 'The requested asset could not be found. It may have been moved or deleted.';
    } else if (url.includes('/processes/')) {
      return 'The requested process could not be found. It may have been completed or cancelled.';
    } else if (url.includes('/tasks/')) {
      return 'The requested task could not be found. It may have been completed or removed.';
    } else {
      return 'The requested resource could not be found.';
    }
  }

  private getValidationMessage(error: HttpErrorResponse): string {
    if (error.error?.validationErrors) {
      const errors = Object.entries(error.error.validationErrors)
        .map(([field, messages]) => `${field}: ${(messages as string[]).join(', ')}`)
        .join('; ');
      return `Validation failed: ${errors}`;
    }

    if (error.error?.message) {
      return error.error.message;
    }

    return 'The submitted data is invalid. Please check the required fields and try again.';
  }

  private generateSupportReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `REF-${timestamp}-${random}`.toUpperCase();
  }

  private logError(context: ErrorContext, userFriendlyError: UserFriendlyError): void {
    const errorLog = {
      timestamp: context.timestamp.toISOString(),
      url: context.request.url,
      method: context.request.method,
      status: context.error.status,
      statusText: context.error.statusText,
      message: context.error.message,
      userFriendlyMessage: userFriendlyError.message,
      severity: userFriendlyError.severity,
      code: userFriendlyError.code,
      supportReference: userFriendlyError.supportReference,
      stackTrace: context.error.error?.stack,
      requestHeaders: this.sanitizeHeaders(context.request.headers),
      responseHeaders: this.sanitizeHeaders(context.error.headers),
      requestBody: this.sanitizeRequestBody(context.request.body),
      responseBody: context.error.error
    };

    // Log based on severity
    switch (userFriendlyError.severity) {
      case 'critical':
      case 'error':
        console.error('HTTP Error:', errorLog);
        break;
      case 'warning':
        console.warn('HTTP Warning:', errorLog);
        break;
      default:
        console.log('HTTP Info:', errorLog);
        break;
    }

    // In a real application, send critical errors to monitoring service
    if (userFriendlyError.severity === 'critical' || context.error.status >= 500) {
      this.reportToMonitoringService(errorLog);
    }
  }

  private sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    if (!headers) return sanitized;

    // Convert HttpHeaders to plain object if needed
    const headerObj = headers.keys ? 
      headers.keys().reduce((acc: any, key: string) => {
        acc[key] = headers.get(key);
        return acc;
      }, {}) : headers;

    // Remove sensitive headers
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    Object.entries(headerObj).forEach(([key, value]) => {
      if (!sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = value as string;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return null;

    // Clone and sanitize sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential'];
    
    try {
      const sanitized = JSON.parse(JSON.stringify(body));
      
      const sanitizeObject = (obj: any): void => {
        if (typeof obj === 'object' && obj !== null) {
          Object.keys(obj).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
              obj[key] = '[REDACTED]';
            } else if (typeof obj[key] === 'object') {
              sanitizeObject(obj[key]);
            }
          });
        }
      };

      sanitizeObject(sanitized);
      return sanitized;
    } catch {
      return '[UNABLE_TO_SANITIZE]';
    }
  }

  private reportToMonitoringService(errorLog: any): void {
    // In a real application, this would send to a monitoring service like:
    // - Sentry
    // - DataDog
    // - New Relic
    // - Custom logging endpoint
    
    console.error('Critical error reported to monitoring service:', {
      timestamp: errorLog.timestamp,
      url: errorLog.url,
      status: errorLog.status,
      code: errorLog.code,
      supportReference: errorLog.supportReference
    });
  }
}