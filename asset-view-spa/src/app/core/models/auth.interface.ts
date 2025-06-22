/**
 * Authentication and authorization interfaces
 * Enterprise-level security and user management
 */

import { AuditableEntity } from './common.interface';

export interface User extends AuditableEntity {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  phone?: string;
  department?: string;
  title?: string;
  manager?: string;
  location?: UserLocation;
  preferences: UserPreferences;
  roles: Role[];
  permissions: Permission[];
  status: UserStatus;
  lastLoginAt?: Date;
  passwordLastChanged?: Date;
  mfaEnabled: boolean;
  sessionTimeoutMinutes: number;
  metadata?: UserMetadata;
}

export interface UserLocation {
  office: string;
  address?: string;
  timezone: string;
  workingHours?: WorkingHours;
}

export interface WorkingHours {
  start: string; // HH:mm format
  end: string; // HH:mm format
  daysOfWeek: number[]; // 0-6, where 0 is Sunday
}

export interface UserPreferences {
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  currency: string;
  notifications: NotificationPreferences;
  dashboard: DashboardPreferences;
  accessibility: AccessibilityPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  inApp: boolean;
  desktop: boolean;
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  categories: NotificationCategory[];
}

export interface NotificationCategory {
  type: string;
  enabled: boolean;
  methods: ('email' | 'sms' | 'inApp' | 'desktop')[];
}

export interface DashboardPreferences {
  layout: 'default' | 'compact' | 'detailed';
  widgets: DashboardWidget[];
  theme: 'light' | 'dark' | 'auto';
  defaultFilters: Record<string, any>;
}

export interface DashboardWidget {
  id: string;
  type: string;
  position: { x: number; y: number; width: number; height: number };
  configuration: Record<string, any>;
  isVisible: boolean;
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  screenReader: boolean;
  keyboardNavigation: boolean;
  reducedMotion: boolean;
}

export interface UserMetadata {
  employeeId?: string;
  externalUserId?: string;
  costCenter?: string;
  certifications: Certification[];
  skills: Skill[];
}

export interface Certification {
  name: string;
  issuer: string;
  issuedDate: Date;
  expiryDate?: Date;
  status: 'active' | 'expired' | 'pending';
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verifiedBy?: string;
  verifiedAt?: Date;
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_ACTIVATION = 'pending_activation',
  LOCKED = 'locked'
}

export interface Role extends AuditableEntity {
  name: string;
  displayName: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
  isActive: boolean;
  parentRoleId?: string;
  metadata?: RoleMetadata;
}

export interface RoleMetadata {
  category: string;
  level: number; // Hierarchy level
  maxUsers?: number;
  requiredCertifications?: string[];
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  scope?: PermissionScope;
}

export interface PermissionCondition {
  field: string;
  operator: string;
  value: any;
}

export interface PermissionScope {
  type: 'global' | 'organization' | 'department' | 'team' | 'personal';
  entityIds?: string[];
}

// Authentication interfaces
export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
  mfaToken?: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: Date;
  permissions: string[];
  mfaRequired?: boolean;
  temporaryPassword?: boolean;
}

export interface TokenInfo {
  token: string;
  refreshToken: string;
  expiresAt: Date;
  issuedAt: Date;
  userId: string;
  sessionId: string;
  scope: string[];
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordResetRequest {
  email: string;
  callbackUrl?: string;
}

export interface MfaSetupRequest {
  method: MfaMethod;
  phoneNumber?: string;
  backupCodes?: boolean;
}

export enum MfaMethod {
  TOTP = 'totp', // Time-based One-Time Password (authenticator app)
  SMS = 'sms',
  EMAIL = 'email',
  HARDWARE_TOKEN = 'hardware_token'
}

export interface MfaChallenge {
  challengeId: string;
  method: MfaMethod;
  maskedDestination?: string; // e.g., "***-***-1234" for SMS
  expiresAt: Date;
}

export interface MfaVerification {
  challengeId: string;
  code: string;
}

// Session management
export interface UserSession {
  id: string;
  userId: string;
  deviceInfo: DeviceInfo;
  ipAddress: string;
  userAgent: string;
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  isActive: boolean;
  location?: SessionLocation;
}

export interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  fingerprint: string;
}

export interface SessionLocation {
  country: string;
  region: string;
  city: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// Audit and security
export interface SecurityEvent {
  id: string;
  userId?: string;
  sessionId?: string;
  eventType: SecurityEventType;
  description: string;
  severity: SecurityEventSeverity;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, any>;
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  PERMISSION_GRANTED = 'permission_granted',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  ACCOUNT_LOCKED = 'account_locked',
  SESSION_EXPIRED = 'session_expired'
}

export enum SecurityEventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ApiKey extends AuditableEntity {
  name: string;
  keyId: string;
  hashedKey: string;
  userId: string;
  permissions: Permission[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  isActive: boolean;
  ipWhitelist?: string[];
  rateLimit?: RateLimit;
}

export interface RateLimit {
  requests: number;
  windowMs: number; // Time window in milliseconds
  skipSuccessfulRequests?: boolean;
}

// Authorization helpers
export interface AuthorizationContext {
  user: User;
  resource: string;
  action: string;
  entityId?: string;
  additionalContext?: Record<string, any>;
}