export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  permissions: Permission[];
  avatarUrl?: string;
  lastLoginDate?: Date;
  isActive: boolean;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  user: User;
  token: AuthToken;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  AGENT = 'agent',
  VIEWER = 'viewer'
}

export enum Permission {
  VIEW_ASSETS = 'view_assets',
  EDIT_ASSETS = 'edit_assets',
  DELETE_ASSETS = 'delete_assets',
  VIEW_PROCESSES = 'view_processes',
  EDIT_PROCESSES = 'edit_processes',
  VIEW_TASKS = 'view_tasks',
  EDIT_TASKS = 'edit_tasks',
  ASSIGN_TASKS = 'assign_tasks',
  VIEW_REPORTS = 'view_reports',
  MANAGE_USERS = 'manage_users'
}

export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}