/**
 * Enterprise Error Handler Component
 * Demonstrates sophisticated error handling and user experience patterns
 */

import { 
  Component, 
  Input, 
  Output, 
  EventEmitter, 
  ChangeDetectionStrategy,
  OnInit
} from '@angular/core';
import { Observable, timer } from 'rxjs';
import { map, takeWhile } from 'rxjs/operators';

export interface ErrorInfo {
  title: string;
  message: string;
  code?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  actionRequired?: string;
  supportReference?: string;
  retryAfter?: number;
  canRetry: boolean;
  details?: any;
}

export interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  currentAttempt: number;
  nextRetryIn?: number;
  backoffMultiplier: number;
}

@Component({
  selector: 'app-error-handler',
  templateUrl: './error-handler.component.html',
  styleUrls: ['./error-handler.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorHandlerComponent implements OnInit {
  @Input() error: any;
  @Input() context: string = 'general';
  @Input() showDetails: boolean = false;
  @Input() retryConfig: RetryConfig = {
    enabled: true,
    maxAttempts: 3,
    currentAttempt: 0,
    backoffMultiplier: 2
  };

  @Output() retry = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();
  @Output() reportIssue = new EventEmitter<ErrorInfo>();
  @Output() contactSupport = new EventEmitter<ErrorInfo>();

  errorInfo: ErrorInfo | null = null;
  retryCountdown$: Observable<number> | null = null;
  showDetailedInfo = false;

  // Error icons mapping
  errorIcons = {
    info: 'info',
    warning: 'warning',
    error: 'error',
    critical: 'dangerous'
  };

  // Error colors mapping
  errorColors = {
    info: 'accent',
    warning: 'warn', 
    error: 'warn',
    critical: 'warn'
  };

  ngOnInit(): void {
    if (this.error) {
      this.errorInfo = this.transformError(this.error);
      this.setupRetryCountdown();
    }
  }

  onRetry(): void {
    if (this.canRetry()) {
      this.retryConfig.currentAttempt++;
      this.retry.emit();
      
      console.log('🔄 Retry attempted:', {
        attempt: this.retryConfig.currentAttempt,
        maxAttempts: this.retryConfig.maxAttempts,
        context: this.context
      });
    }
  }

  onDismiss(): void {
    this.dismiss.emit();
  }

  onReportIssue(): void {
    if (this.errorInfo) {
      this.reportIssue.emit(this.errorInfo);
      
      console.log('📝 Issue reported:', {
        error: this.errorInfo,
        context: this.context,
        timestamp: new Date().toISOString()
      });
    }
  }

  onContactSupport(): void {
    if (this.errorInfo) {
      this.contactSupport.emit(this.errorInfo);
      
      console.log('📞 Support contact requested:', {
        error: this.errorInfo,
        context: this.context
      });
    }
  }

  toggleDetails(): void {
    this.showDetailedInfo = !this.showDetailedInfo;
  }

  canRetry(): boolean {
    return this.retryConfig.enabled && 
           this.retryConfig.currentAttempt < this.retryConfig.maxAttempts &&
           this.errorInfo?.canRetry === true;
  }

  getRetryButtonText(): string {
    if (!this.canRetry()) {
      return 'Retry Not Available';
    }
    
    const remaining = this.retryConfig.maxAttempts - this.retryConfig.currentAttempt;
    return `Retry (${remaining} attempts remaining)`;
  }

  copyErrorDetails(): void {
    if (this.errorInfo) {
      const errorDetails = {
        code: this.errorInfo.code,
        message: this.errorInfo.message,
        supportReference: this.errorInfo.supportReference,
        timestamp: new Date().toISOString(),
        context: this.context,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
        .then(() => {
          console.log('📋 Error details copied to clipboard');
          // Could show a toast notification here
        })
        .catch(err => {
          console.error('Failed to copy error details:', err);
        });
    }
  }

  private transformError(error: any): ErrorInfo {
    // Transform various error types into user-friendly format
    
    if (error.userFriendly) {
      // Already transformed by our interceptor
      return {
        title: error.userFriendly.title,
        message: error.userFriendly.message,
        code: error.userFriendly.code,
        severity: error.userFriendly.severity,
        actionRequired: error.userFriendly.actionRequired,
        supportReference: error.userFriendly.supportReference,
        canRetry: this.isRetryableError(error.status),
        details: error
      };
    }

    // Handle HTTP errors
    if (error.status) {
      return this.transformHttpError(error);
    }

    // Handle JavaScript errors
    if (error instanceof Error) {
      return this.transformJavaScriptError(error);
    }

    // Handle unknown errors
    return this.transformUnknownError(error);
  }

  private transformHttpError(error: any): ErrorInfo {
    const baseError: ErrorInfo = {
      title: 'Request Failed',
      message: 'An error occurred while processing your request.',
      severity: 'error',
      canRetry: this.isRetryableError(error.status),
      details: error
    };

    switch (error.status) {
      case 0:
        return {
          ...baseError,
          title: 'Connection Problem',
          message: 'Unable to connect to the server. Please check your internet connection.',
          actionRequired: 'check_connection',
          canRetry: true
        };

      case 400:
        return {
          ...baseError,
          title: 'Invalid Request',
          message: 'The request contains invalid data. Please check your input.',
          severity: 'warning',
          actionRequired: 'correct_input',
          canRetry: false
        };

      case 401:
        return {
          ...baseError,
          title: 'Authentication Required',
          message: 'Your session has expired. Please log in again.',
          actionRequired: 'login_required',
          canRetry: false
        };

      case 403:
        return {
          ...baseError,
          title: 'Access Denied',
          message: 'You do not have permission to perform this action.',
          actionRequired: 'contact_administrator',
          canRetry: false
        };

      case 404:
        return {
          ...baseError,
          title: 'Not Found',
          message: 'The requested resource could not be found.',
          actionRequired: 'verify_resource',
          canRetry: false
        };

      case 409:
        return {
          ...baseError,
          title: 'Conflict',
          message: 'The resource has been modified by another user. Please refresh and try again.',
          actionRequired: 'refresh_data',
          canRetry: true
        };

      case 429:
        return {
          ...baseError,
          title: 'Too Many Requests',
          message: 'You are making requests too quickly. Please wait a moment.',
          actionRequired: 'wait_and_retry',
          retryAfter: error.retryAfter || 60000,
          canRetry: true
        };

      case 500:
        return {
          ...baseError,
          title: 'Server Error',
          message: 'An unexpected server error occurred. Our team has been notified.',
          severity: 'error',
          actionRequired: 'try_again_later',
          supportReference: this.generateSupportReference(),
          canRetry: true
        };

      case 502:
      case 503:
      case 504:
        return {
          ...baseError,
          title: 'Service Unavailable',
          message: 'The service is temporarily unavailable. Please try again in a few minutes.',
          actionRequired: 'try_again_later',
          canRetry: true
        };

      default:
        return {
          ...baseError,
          title: 'Unexpected Error',
          message: `An unexpected error occurred (${error.status}). Please try again.`,
          code: `HTTP_${error.status}`,
          supportReference: this.generateSupportReference(),
          canRetry: true
        };
    }
  }

  private transformJavaScriptError(error: Error): ErrorInfo {
    return {
      title: 'Application Error',
      message: 'An unexpected error occurred in the application.',
      code: error.name,
      severity: 'error',
      actionRequired: 'refresh_page',
      canRetry: true,
      details: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    };
  }

  private transformUnknownError(error: any): ErrorInfo {
    return {
      title: 'Unknown Error',
      message: 'An unexpected error occurred. Please try again.',
      severity: 'error',
      actionRequired: 'contact_support',
      supportReference: this.generateSupportReference(),
      canRetry: true,
      details: error
    };
  }

  private isRetryableError(status: number): boolean {
    // Define which HTTP status codes are retryable
    const retryableStatuses = [0, 408, 409, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(status);
  }

  private setupRetryCountdown(): void {
    if (this.errorInfo?.retryAfter) {
      const retryAfterSeconds = Math.ceil(this.errorInfo.retryAfter / 1000);
      
      this.retryCountdown$ = timer(0, 1000).pipe(
        map(tick => retryAfterSeconds - tick),
        takeWhile(count => count >= 0)
      );
    }
  }

  private generateSupportReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ERR-${timestamp}-${random}`.toUpperCase();
  }

  // Helper method for templates
  getActionButtonText(): string {
    if (!this.errorInfo?.actionRequired) return '';

    const actionTexts: Record<string, string> = {
      'check_connection': 'Check Connection',
      'correct_input': 'Review Input',
      'login_required': 'Log In',
      'contact_administrator': 'Contact Admin',
      'verify_resource': 'Go Back',
      'refresh_data': 'Refresh',
      'wait_and_retry': 'Wait and Retry',
      'try_again_later': 'Try Again',
      'refresh_page': 'Refresh Page',
      'contact_support': 'Contact Support'
    };

    return actionTexts[this.errorInfo.actionRequired] || 'Take Action';
  }

  getActionButtonIcon(): string {
    if (!this.errorInfo?.actionRequired) return '';

    const actionIcons: Record<string, string> = {
      'check_connection': 'wifi',
      'correct_input': 'edit',
      'login_required': 'login',
      'contact_administrator': 'admin_panel_settings',
      'verify_resource': 'arrow_back',
      'refresh_data': 'refresh',
      'wait_and_retry': 'schedule',
      'try_again_later': 'refresh',
      'refresh_page': 'refresh',
      'contact_support': 'support_agent'
    };

    return actionIcons[this.errorInfo.actionRequired] || 'help';
  }
}