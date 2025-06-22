/**
 * Enterprise Authentication Service
 * Demonstrates sophisticated security patterns and token management
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, timer, of, throwError } from 'rxjs';
import { map, switchMap, tap, catchError, filter, take } from 'rxjs/operators';
import { Router } from '@angular/router';

import { BaseApiService } from './base-api.service';
import { 
  User, 
  LoginRequest, 
  LoginResponse, 
  TokenInfo, 
  RefreshTokenRequest,
  PasswordChangeRequest,
  MfaChallenge,
  MfaVerification,
  UserSession,
  SecurityEvent,
  SecurityEventType,
  SecurityEventSeverity,
  UserStatus
} from '../models';

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  permissions: string[];
  tokenInfo: TokenInfo | null;
  isLoading: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService extends BaseApiService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';
  private readonly SESSION_TIMEOUT_WARNING = 5 * 60 * 1000; // 5 minutes before expiry

  private authStateSubject = new BehaviorSubject<AuthState>({
    isAuthenticated: false,
    user: null,
    permissions: [],
    tokenInfo: null,
    isLoading: false,
    error: null
  });

  private sessionTimerSubscription: any;
  private sessionWarningSubject = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {
    super();
    this.initializeAuth();
    this.startSessionMonitoring();
  }

  /**
   * Observable auth state for reactive UI updates
   */
  get authState$(): Observable<AuthState> {
    return this.authStateSubject.asObservable();
  }

  /**
   * Current auth state snapshot
   */
  get currentAuthState(): AuthState {
    return this.authStateSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  get isAuthenticated(): boolean {
    return this.authStateSubject.value.isAuthenticated;
  }

  /**
   * Current user observable
   */
  get currentUser$(): Observable<User | null> {
    return this.authState$.pipe(map(state => state.user));
  }

  /**
   * Current user snapshot
   */
  get currentUser(): User | null {
    return this.authStateSubject.value.user;
  }

  /**
   * User permissions observable
   */
  get permissions$(): Observable<string[]> {
    return this.authState$.pipe(map(state => state.permissions));
  }

  /**
   * Session warning observable
   */
  get sessionWarning$(): Observable<boolean> {
    return this.sessionWarningSubject.asObservable();
  }

  /**
   * Login with credentials
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.updateAuthState({ isLoading: true, error: null });

    return this.simulateLogin(credentials).pipe(
      tap(response => {
        if (response.success) {
          this.handleSuccessfulLogin(response);
          this.logSecurityEvent(SecurityEventType.LOGIN_SUCCESS, 'User logged in successfully');
        } else {
          this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, 'Login attempt failed');
        }
      }),
      catchError(error => {
        this.updateAuthState({ isLoading: false, error: error.message });
        this.logSecurityEvent(SecurityEventType.LOGIN_FAILED, `Login failed: ${error.message}`);
        return throwError(error);
      })
    );
  }

  /**
   * Logout user and clean up session
   */
  logout(): Observable<boolean> {
    return this.post<boolean>('/auth/logout', {}).pipe(
      tap(() => {
        this.handleLogout();
        this.logSecurityEvent(SecurityEventType.LOGOUT, 'User logged out');
      }),
      catchError(() => {
        // Even if logout API fails, clean up local session
        this.handleLogout();
        return of(true);
      })
    );
  }

  /**
   * Refresh authentication token
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getStoredRefreshToken();
    if (!refreshToken) {
      return throwError({ message: 'No refresh token available' });
    }

    const request: RefreshTokenRequest = { refreshToken };
    
    return this.post<LoginResponse>('/auth/refresh', request).pipe(
      map(response => response.data),
      tap(response => {
        if (response.success) {
          this.handleSuccessfulLogin(response);
        } else {
          this.handleLogout();
        }
      }),
      catchError(error => {
        this.handleLogout();
        return throwError(error);
      })
    );
  }

  /**
   * Change user password
   */
  changePassword(request: PasswordChangeRequest): Observable<boolean> {
    return this.put<boolean>('/auth/change-password', request).pipe(
      map(response => response.data),
      tap(() => {
        this.logSecurityEvent(SecurityEventType.PASSWORD_CHANGED, 'Password changed successfully');
      })
    );
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(permission: string): boolean {
    return this.authStateSubject.value.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.authStateSubject.value.permissions;
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Check if user has all specified permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.authStateSubject.value.permissions;
    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Get current session information
   */
  getCurrentSession(): Observable<UserSession> {
    return this.get<UserSession>('/auth/session');
  }

  /**
   * Get user's active sessions
   */
  getActiveSessions(): Observable<UserSession[]> {
    return this.get<UserSession[]>('/auth/sessions');
  }

  /**
   * Terminate a specific session
   */
  terminateSession(sessionId: string): Observable<boolean> {
    return this.delete<boolean>(`/auth/sessions/${sessionId}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Extend current session
   */
  extendSession(): Observable<boolean> {
    return this.post<boolean>('/auth/extend-session', {}).pipe(
      map(response => response.data),
      tap(() => {
        // Update token expiry time
        const currentToken = this.getStoredTokenInfo();
        if (currentToken) {
          const extendedExpiry = new Date(Date.now() + (30 * 60 * 1000)); // Extend by 30 minutes
          const updatedToken: TokenInfo = {
            ...currentToken,
            expiresAt: extendedExpiry
          };
          this.storeTokenInfo(updatedToken);
          this.updateAuthState({ tokenInfo: updatedToken });
        }
      })
    );
  }

  private initializeAuth(): void {
    const tokenInfo = this.getStoredTokenInfo();
    const user = this.getStoredUser();

    if (tokenInfo && user && this.isTokenValid(tokenInfo)) {
      this.updateAuthState({
        isAuthenticated: true,
        user,
        permissions: this.extractPermissions(user),
        tokenInfo,
        isLoading: false,
        error: null
      });
    } else {
      this.clearStoredAuth();
    }
  }

  private handleSuccessfulLogin(response: LoginResponse): void {
    const tokenInfo: TokenInfo = {
      token: response.token,
      refreshToken: response.refreshToken,
      expiresAt: response.expiresAt,
      issuedAt: new Date(),
      userId: response.user.id,
      sessionId: this.generateSessionId(),
      scope: response.permissions
    };

    this.storeTokenInfo(tokenInfo);
    this.storeUser(response.user);

    this.updateAuthState({
      isAuthenticated: true,
      user: response.user,
      permissions: response.permissions,
      tokenInfo,
      isLoading: false,
      error: null
    });

    this.startSessionMonitoring();
  }

  private handleLogout(): void {
    this.clearStoredAuth();
    this.stopSessionMonitoring();
    
    this.updateAuthState({
      isAuthenticated: false,
      user: null,
      permissions: [],
      tokenInfo: null,
      isLoading: false,
      error: null
    });

    this.router.navigate(['/login']);
  }

  private updateAuthState(partial: Partial<AuthState>): void {
    const currentState = this.authStateSubject.value;
    this.authStateSubject.next({ ...currentState, ...partial });
  }

  private storeTokenInfo(tokenInfo: TokenInfo): void {
    localStorage.setItem(this.TOKEN_KEY, tokenInfo.token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokenInfo.refreshToken);
    localStorage.setItem('token_info', JSON.stringify(tokenInfo));
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private getStoredTokenInfo(): TokenInfo | null {
    try {
      const tokenInfoStr = localStorage.getItem('token_info');
      if (tokenInfoStr) {
        const tokenInfo = JSON.parse(tokenInfoStr);
        tokenInfo.expiresAt = new Date(tokenInfo.expiresAt);
        tokenInfo.issuedAt = new Date(tokenInfo.issuedAt);
        return tokenInfo;
      }
    } catch (error) {
      console.error('Error parsing stored token info:', error);
    }
    return null;
  }

  private getStoredRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.USER_KEY);
      if (userStr) {
        const user = JSON.parse(userStr);
        // Convert date strings back to Date objects
        user.createdAt = new Date(user.createdAt);
        user.updatedAt = new Date(user.updatedAt);
        if (user.lastLoginAt) user.lastLoginAt = new Date(user.lastLoginAt);
        if (user.passwordLastChanged) user.passwordLastChanged = new Date(user.passwordLastChanged);
        return user;
      }
    } catch (error) {
      console.error('Error parsing stored user:', error);
    }
    return null;
  }

  private clearStoredAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('token_info');
  }

  private isTokenValid(tokenInfo: TokenInfo): boolean {
    return new Date() < new Date(tokenInfo.expiresAt);
  }

  private extractPermissions(user: User): string[] {
    const permissions: string[] = [];
    
    // Extract permissions from roles
    user.roles?.forEach(role => {
      role.permissions?.forEach(permission => {
        permissions.push(`${permission.resource}:${permission.action}`);
      });
    });

    // Add direct permissions
    user.permissions?.forEach(permission => {
      permissions.push(`${permission.resource}:${permission.action}`);
    });

    return [...new Set(permissions)]; // Remove duplicates
  }

  private startSessionMonitoring(): void {
    this.stopSessionMonitoring();

    const tokenInfo = this.getStoredTokenInfo();
    if (!tokenInfo) return;

    const expiryTime = new Date(tokenInfo.expiresAt).getTime();
    const warningTime = expiryTime - this.SESSION_TIMEOUT_WARNING;
    const now = Date.now();

    if (warningTime > now) {
      // Set warning timer
      timer(warningTime - now).subscribe(() => {
        this.sessionWarningSubject.next(true);
      });
    }

    // Set expiry timer
    if (expiryTime > now) {
      timer(expiryTime - now).subscribe(() => {
        this.handleSessionExpiry();
      });
    }
  }

  private stopSessionMonitoring(): void {
    if (this.sessionTimerSubscription) {
      this.sessionTimerSubscription.unsubscribe();
    }
    this.sessionWarningSubject.next(false);
  }

  private handleSessionExpiry(): void {
    this.logSecurityEvent(SecurityEventType.SESSION_EXPIRED, 'Session expired');
    this.handleLogout();
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  private logSecurityEvent(type: SecurityEventType, description: string): void {
    const event: Partial<SecurityEvent> = {
      eventType: type,
      description,
      severity: this.getEventSeverity(type),
      timestamp: new Date(),
      userId: this.currentUser?.id,
      ipAddress: 'unknown', // Would be filled by interceptor
      userAgent: navigator.userAgent
    };

    // In a real application, this would be sent to a logging service
    console.log('Security Event:', event);
  }

  private getEventSeverity(type: SecurityEventType): SecurityEventSeverity {
    switch (type) {
      case SecurityEventType.LOGIN_FAILED:
      case SecurityEventType.PERMISSION_DENIED:
        return SecurityEventSeverity.MEDIUM;
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
      case SecurityEventType.ACCOUNT_LOCKED:
        return SecurityEventSeverity.HIGH;
      default:
        return SecurityEventSeverity.LOW;
    }
  }

  // Simulated login for demo purposes
  private simulateLogin(credentials: LoginRequest): Observable<LoginResponse> {
    // Simulate API delay
    return timer(1000).pipe(
      switchMap(() => {
        // Demo credentials
        if (credentials.username === 'demo@example.com' && credentials.password === 'demo123') {
          const mockUser: User = {
            id: 'user-123',
            username: credentials.username,
            email: credentials.username,
            firstName: 'Demo',
            lastName: 'User',
            displayName: 'Demo User',
            department: 'Asset Management',
            title: 'Senior Asset Manager',
            status: UserStatus.ACTIVE,
            mfaEnabled: false,
            sessionTimeoutMinutes: 30,
            preferences: {
              language: 'en',
              dateFormat: 'MM/dd/yyyy',
              timeFormat: '12h',
              currency: 'USD',
              notifications: {
                email: true,
                sms: false,
                inApp: true,
                desktop: true,
                frequency: 'immediate',
                categories: []
              },
              dashboard: {
                layout: 'default',
                widgets: [],
                theme: 'light',
                defaultFilters: {}
              },
              accessibility: {
                highContrast: false,
                fontSize: 'medium',
                screenReader: false,
                keyboardNavigation: false,
                reducedMotion: false
              }
            },
            roles: [{
              id: 'role-1',
              name: 'asset_manager',
              displayName: 'Asset Manager',
              description: 'Full access to asset management features',
              permissions: [
                { id: 'perm-1', name: 'view_assets', resource: 'assets', action: 'view' },
                { id: 'perm-2', name: 'edit_assets', resource: 'assets', action: 'edit' },
                { id: 'perm-3', name: 'view_processes', resource: 'processes', action: 'view' },
                { id: 'perm-4', name: 'edit_processes', resource: 'processes', action: 'edit' }
              ],
              isSystemRole: true,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              createdBy: 'system',
              updatedBy: 'system',
              version: 1
            }],
            permissions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: 'system',
            updatedBy: 'system',
            version: 1
          };

          const response: LoginResponse = {
            success: true,
            token: 'mock-jwt-token-' + Date.now(),
            refreshToken: 'mock-refresh-token-' + Date.now(),
            user: mockUser,
            expiresAt: new Date(Date.now() + (30 * 60 * 1000)), // 30 minutes
            permissions: ['assets:view', 'assets:edit', 'processes:view', 'processes:edit']
          };

          return of(response);
        } else {
          return throwError({ message: 'Invalid credentials' });
        }
      })
    );
  }
}