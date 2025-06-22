/**
 * Authentication HTTP Interceptor
 * Enterprise-level request/response interception with security logging
 */

import { Injectable } from '@angular/core';
import { 
  HttpInterceptor, 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpErrorResponse,
  HttpResponse 
} from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, EMPTY } from 'rxjs';
import { 
  catchError, 
  switchMap, 
  filter, 
  take, 
  tap, 
  finalize 
} from 'rxjs/operators';

import { AuthService } from '../services/auth.service';
import { SecurityEventType } from '../models';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject = new BehaviorSubject<any>(null);

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip authentication for public endpoints
    if (this.isPublicEndpoint(request.url)) {
      return next.handle(request);
    }

    // Add authentication token to request
    const authRequest = this.addAuthToken(request);

    return next.handle(authRequest).pipe(
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          // Log successful API calls for security monitoring
          this.logApiCall(request, event.status);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          return this.handle401Error(authRequest, next);
        } else if (error.status === 403) {
          return this.handle403Error(request, error);
        } else {
          return this.handleGenericError(request, error);
        }
      })
    );
  }

  private addAuthToken(request: HttpRequest<any>): HttpRequest<any> {
    const currentUser = this.authService.currentUser;
    const tokenInfo = this.authService.currentAuthState.tokenInfo;

    if (!tokenInfo || !currentUser) {
      return request;
    }

    // Clone request and add authorization header
    return request.clone({
      setHeaders: {
        'Authorization': `Bearer ${tokenInfo.token}`,
        'X-User-ID': currentUser.id,
        'X-Session-ID': tokenInfo.sessionId,
        'X-Request-ID': this.generateRequestId(),
        'X-Timestamp': new Date().toISOString()
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      // Attempt to refresh token
      return this.authService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.token);
          
          // Retry original request with new token
          const newAuthRequest = this.addAuthToken(request);
          return next.handle(newAuthRequest);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          
          // Token refresh failed, logout user
          this.logSecurityEvent(
            SecurityEventType.SESSION_EXPIRED, 
            'Token refresh failed, forcing logout',
            request
          );
          
          this.authService.logout().subscribe();
          return throwError(error);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Token refresh is already in progress, wait for it
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(() => {
          const newAuthRequest = this.addAuthToken(request);
          return next.handle(newAuthRequest);
        })
      );
    }
  }

  private handle403Error(request: HttpRequest<any>, error: HttpErrorResponse): Observable<never> {
    // Log permission denied event
    this.logSecurityEvent(
      SecurityEventType.PERMISSION_DENIED,
      `Access denied to ${request.method} ${request.url}`,
      request,
      error
    );

    // Check if user has required permissions
    const currentUser = this.authService.currentUser;
    if (currentUser) {
      console.warn('Permission denied for user:', {
        userId: currentUser.id,
        username: currentUser.username,
        roles: currentUser.roles?.map(r => r.name),
        permissions: this.authService.currentAuthState.permissions,
        requestedResource: request.url,
        method: request.method
      });
    }

    return throwError({
      ...error,
      userMessage: 'You do not have permission to access this resource.',
      actionRequired: 'contact_administrator'
    });
  }

  private handleGenericError(request: HttpRequest<any>, error: HttpErrorResponse): Observable<never> {
    // Log API errors for monitoring
    console.error('API Error:', {
      url: request.url,
      method: request.method,
      status: error.status,
      message: error.message,
      timestamp: new Date().toISOString(),
      userId: this.authService.currentUser?.id
    });

    // Detect suspicious activity patterns
    if (this.isSuspiciousActivity(request, error)) {
      this.logSecurityEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        `Suspicious API activity detected: ${error.status} on ${request.url}`,
        request,
        error
      );
    }

    return throwError(error);
  }

  private isPublicEndpoint(url: string): boolean {
    const publicEndpoints = [
      '/api/v1/auth/login',
      '/api/v1/auth/refresh',
      '/api/v1/auth/forgot-password',
      '/api/v1/health',
      '/api/v1/version'
    ];

    return publicEndpoints.some(endpoint => url.includes(endpoint));
  }

  private isSuspiciousActivity(request: HttpRequest<any>, error: HttpErrorResponse): boolean {
    // Define patterns that might indicate suspicious activity
    const suspiciousPatterns = [
      error.status === 429, // Too many requests
      error.status === 418, // I'm a teapot (often used for rate limiting)
      request.url.includes('admin') && error.status === 403,
      request.url.includes('../') || request.url.includes('..\\'), // Path traversal attempts
      request.headers.get('User-Agent')?.includes('bot'),
      error.status === 400 && error.error?.message?.includes('injection')
    ];

    return suspiciousPatterns.some(pattern => pattern === true);
  }

  private logApiCall(request: HttpRequest<any>, statusCode: number): void {
    // Log successful API calls for audit trail
    const currentUser = this.authService.currentUser;
    
    console.log('API Call:', {
      method: request.method,
      url: request.url,
      status: statusCode,
      userId: currentUser?.id,
      username: currentUser?.username,
      timestamp: new Date().toISOString(),
      requestId: request.headers.get('X-Request-ID')
    });
  }

  private logSecurityEvent(
    eventType: SecurityEventType, 
    description: string, 
    request: HttpRequest<any>,
    error?: HttpErrorResponse
  ): void {
    const currentUser = this.authService.currentUser;
    
    const securityEvent = {
      eventType,
      description,
      severity: this.getEventSeverity(eventType),
      timestamp: new Date(),
      userId: currentUser?.id,
      ipAddress: this.extractIpAddress(request),
      userAgent: request.headers.get('User-Agent') || 'unknown',
      metadata: {
        url: request.url,
        method: request.method,
        statusCode: error?.status,
        errorMessage: error?.message,
        requestId: request.headers.get('X-Request-ID')
      }
    };

    // In a real application, this would be sent to a security monitoring service
    console.warn('Security Event:', securityEvent);
  }

  private getEventSeverity(eventType: SecurityEventType): string {
    const severityMap = {
      [SecurityEventType.PERMISSION_DENIED]: 'medium',
      [SecurityEventType.SESSION_EXPIRED]: 'low',
      [SecurityEventType.SUSPICIOUS_ACTIVITY]: 'high',
      [SecurityEventType.LOGIN_FAILED]: 'medium'
    };

    return severityMap[eventType] || 'low';
  }

  private extractIpAddress(request: HttpRequest<any>): string {
    // In a real application, this would extract the actual client IP
    // from headers like X-Forwarded-For, X-Real-IP, etc.
    return request.headers.get('X-Forwarded-For') || 
           request.headers.get('X-Real-IP') || 
           'unknown';
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}