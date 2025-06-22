/**
 * Logging HTTP Interceptor
 * Enterprise-level request/response logging and performance monitoring
 */

import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

export interface RequestLog {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: Date;
  userId?: string;
}

export interface ResponseLog {
  requestId: string;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: Date;
  duration: number;
}

export interface PerformanceMetrics {
  requestId: string;
  url: string;
  method: string;
  duration: number;
  size: {
    request: number;
    response: number;
  };
  cached: boolean;
  timestamp: Date;
}

@Injectable()
export class LoggingInterceptor implements HttpInterceptor {
  private activeRequests = new Map<string, { startTime: number; request: RequestLog }>();

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip logging for certain endpoints to reduce noise
    if (this.shouldSkipLogging(request.url)) {
      return next.handle(request);
    }

    const requestId = this.generateRequestId();
    const startTime = performance.now();

    // Log request
    const requestLog = this.createRequestLog(request, requestId);
    this.logRequest(requestLog);
    
    // Track active request
    this.activeRequests.set(requestId, { startTime, request: requestLog });

    return next.handle(request).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const duration = performance.now() - startTime;
          
          // Log response
          const responseLog = this.createResponseLog(event, requestId, duration);
          this.logResponse(responseLog);
          
          // Log performance metrics
          const metrics = this.createPerformanceMetrics(requestLog, event, duration);
          this.logPerformanceMetrics(metrics);
          
          // Check for performance issues
          this.checkPerformanceThresholds(metrics);
        }
      }),
      finalize(() => {
        // Clean up tracking
        this.activeRequests.delete(requestId);
      })
    );
  }

  private shouldSkipLogging(url: string): boolean {
    const skipPatterns = [
      '/health',
      '/ping',
      '/metrics',
      'favicon.ico',
      '.js',
      '.css',
      '.map'
    ];

    return skipPatterns.some(pattern => url.includes(pattern));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private createRequestLog(request: HttpRequest<any>, requestId: string): RequestLog {
    return {
      id: requestId,
      method: request.method,
      url: request.url,
      headers: this.sanitizeHeaders(request.headers),
      body: this.sanitizeRequestBody(request.body),
      timestamp: new Date(),
      userId: this.extractUserId(request)
    };
  }

  private createResponseLog(response: HttpResponse<any>, requestId: string, duration: number): ResponseLog {
    return {
      requestId,
      status: response.status,
      statusText: response.statusText,
      headers: this.sanitizeHeaders(response.headers),
      body: this.sanitizeResponseBody(response.body),
      timestamp: new Date(),
      duration: Math.round(duration)
    };
  }

  private createPerformanceMetrics(requestLog: RequestLog, response: HttpResponse<any>, duration: number): PerformanceMetrics {
    return {
      requestId: requestLog.id,
      url: requestLog.url,
      method: requestLog.method,
      duration: Math.round(duration),
      size: {
        request: this.calculateRequestSize(requestLog),
        response: this.calculateResponseSize(response)
      },
      cached: this.isCachedResponse(response),
      timestamp: new Date()
    };
  }

  private logRequest(requestLog: RequestLog): void {
    if (this.isDebugMode()) {
      console.groupCollapsed(`🚀 ${requestLog.method} ${requestLog.url}`);
      console.log('Request ID:', requestLog.id);
      console.log('Timestamp:', requestLog.timestamp.toISOString());
      console.log('Headers:', requestLog.headers);
      if (requestLog.body) {
        console.log('Body:', requestLog.body);
      }
      if (requestLog.userId) {
        console.log('User ID:', requestLog.userId);
      }
      console.groupEnd();
    }

    // In production, send to logging service
    if (this.isProductionMode()) {
      this.sendToLoggingService('request', requestLog);
    }
  }

  private logResponse(responseLog: ResponseLog): void {
    const emoji = this.getStatusEmoji(responseLog.status);
    const color = this.getStatusColor(responseLog.status);

    if (this.isDebugMode()) {
      console.groupCollapsed(`${emoji} ${responseLog.status} ${responseLog.statusText} (${responseLog.duration}ms)`);
      console.log('Request ID:', responseLog.requestId);
      console.log('Timestamp:', responseLog.timestamp.toISOString());
      console.log('Duration:', `${responseLog.duration}ms`);
      console.log('Headers:', responseLog.headers);
      if (responseLog.body && this.shouldLogResponseBody(responseLog)) {
        console.log('Body:', responseLog.body);
      }
      console.groupEnd();
    }

    // In production, send to logging service
    if (this.isProductionMode()) {
      this.sendToLoggingService('response', responseLog);
    }
  }

  private logPerformanceMetrics(metrics: PerformanceMetrics): void {
    if (this.isDebugMode()) {
      console.log(`📊 Performance Metrics:`, {
        url: metrics.url,
        duration: `${metrics.duration}ms`,
        requestSize: `${this.formatBytes(metrics.size.request)}`,
        responseSize: `${this.formatBytes(metrics.size.response)}`,
        cached: metrics.cached
      });
    }

    // Send to analytics service
    this.sendToAnalyticsService(metrics);
  }

  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    const thresholds = {
      slow: 2000, // 2 seconds
      large: 1024 * 1024, // 1MB
      huge: 5 * 1024 * 1024 // 5MB
    };

    const warnings: string[] = [];

    if (metrics.duration > thresholds.slow) {
      warnings.push(`Slow response: ${metrics.duration}ms`);
    }

    if (metrics.size.request > thresholds.large) {
      warnings.push(`Large request: ${this.formatBytes(metrics.size.request)}`);
    }

    if (metrics.size.response > thresholds.huge) {
      warnings.push(`Huge response: ${this.formatBytes(metrics.size.response)}`);
    }

    if (warnings.length > 0) {
      console.warn(`⚠️ Performance Warning for ${metrics.method} ${metrics.url}:`, warnings);
      
      // Report performance issues
      this.reportPerformanceIssue({
        ...metrics,
        warnings
      });
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

    // Redact sensitive headers but keep structure for debugging
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
    
    // For logging purposes, limit size and redact sensitive data
    const maxSize = 1024; // 1KB for logging
    
    try {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      if (bodyStr.length > maxSize) {
        return `[TRUNCATED - ${bodyStr.length} chars]`;
      }
      
      // Parse and sanitize
      const parsed = typeof body === 'string' ? JSON.parse(body) : body;
      return this.redactSensitiveFields(parsed);
    } catch {
      return '[UNPARSEABLE]';
    }
  }

  private sanitizeResponseBody(body: any): any {
    if (!body) return null;

    const maxSize = 2048; // 2KB for response logging
    
    try {
      const bodyStr = typeof body === 'string' ? body : JSON.stringify(body);
      if (bodyStr.length > maxSize) {
        return `[TRUNCATED - ${bodyStr.length} chars]`;
      }
      return body;
    } catch {
      return '[UNPARSEABLE]';
    }
  }

  private redactSensitiveFields(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credential', 'ssn', 'credit'];
    const sanitized = { ...obj };

    Object.keys(sanitized).forEach(key => {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.redactSensitiveFields(sanitized[key]);
      }
    });

    return sanitized;
  }

  private extractUserId(request: HttpRequest<any>): string | undefined {
    return request.headers.get('X-User-ID') || undefined;
  }

  private calculateRequestSize(requestLog: RequestLog): number {
    try {
      const headersSize = JSON.stringify(requestLog.headers).length;
      const bodySize = requestLog.body ? JSON.stringify(requestLog.body).length : 0;
      return headersSize + bodySize;
    } catch {
      return 0;
    }
  }

  private calculateResponseSize(response: HttpResponse<any>): number {
    try {
      const headersSize = JSON.stringify(this.sanitizeHeaders(response.headers)).length;
      const bodySize = response.body ? JSON.stringify(response.body).length : 0;
      return headersSize + bodySize;
    } catch {
      return 0;
    }
  }

  private isCachedResponse(response: HttpResponse<any>): boolean {
    return response.headers.get('X-Cache') === 'HIT' ||
           response.headers.get('Cache-Control')?.includes('max-age') === true;
  }

  private getStatusEmoji(status: number): string {
    if (status >= 200 && status < 300) return '✅';
    if (status >= 300 && status < 400) return '🔄';
    if (status >= 400 && status < 500) return '⚠️';
    return '❌';
  }

  private getStatusColor(status: number): string {
    if (status >= 200 && status < 300) return 'green';
    if (status >= 300 && status < 400) return 'blue';
    if (status >= 400 && status < 500) return 'orange';
    return 'red';
  }

  private shouldLogResponseBody(responseLog: ResponseLog): boolean {
    // Only log response body for certain content types and successful responses
    const contentType = responseLog.headers['content-type'] || '';
    return responseLog.status < 400 && 
           (contentType.includes('application/json') || contentType.includes('text/'));
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  private isDebugMode(): boolean {
    return !this.isProductionMode() && console.debug !== undefined;
  }

  private isProductionMode(): boolean {
    return typeof process !== 'undefined' && process.env?.['NODE_ENV'] === 'production';
  }

  private sendToLoggingService(type: 'request' | 'response', data: any): void {
    // In a real application, send to logging service
    // Example: LogRocket, DataDog, Splunk, ELK Stack
    console.debug(`Sending ${type} log to service:`, data);
  }

  private sendToAnalyticsService(metrics: PerformanceMetrics): void {
    // In a real application, send to analytics service
    // Example: Google Analytics, Mixpanel, Custom Analytics
    console.debug('Sending performance metrics to analytics:', metrics);
  }

  private reportPerformanceIssue(issue: any): void {
    // In a real application, send to monitoring service
    // Example: New Relic, DataDog APM, Custom Monitoring
    console.warn('Reporting performance issue:', issue);
  }
}