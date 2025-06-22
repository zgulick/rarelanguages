/**
 * Barrel export for HTTP interceptors
 * Enterprise-level interceptor organization
 */

export { AuthInterceptor } from './auth.interceptor';
export { ErrorInterceptor } from './error.interceptor';
export { LoggingInterceptor } from './logging.interceptor';

// Export interceptor provider configuration
export const HTTP_INTERCEPTOR_PROVIDERS = [
  { provide: 'HTTP_INTERCEPTORS', useClass: AuthInterceptor, multi: true },
  { provide: 'HTTP_INTERCEPTORS', useClass: ErrorInterceptor, multi: true },
  { provide: 'HTTP_INTERCEPTORS', useClass: LoggingInterceptor, multi: true }
];