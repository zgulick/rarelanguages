/**
 * Barrel export for all model interfaces
 * Enterprise-level module organization and clean imports
 */

// Common interfaces
export * from './common.interface';

// Domain-specific interfaces
export * from './asset.interface';
export * from './process.interface';
export * from './task.interface';
export * from './auth.interface';

// Re-export commonly used types for convenience
export type {
  ApiResponse,
  LoadingState,
  SearchCriteria,
  FilterCriteria,
  SortCriteria
} from './common.interface';

export type {
  Asset,
  AssetSearchCriteria,
  AssetSummary,
  PropertyAddress
} from './asset.interface';

export type {
  Process,
  ProcessKeyField,
  ProcessMetrics,
  ProcessTemplate
} from './process.interface';

export type {
  Task,
  TaskSearchCriteria,
  TaskSummary,
  TaskGridColumn
} from './task.interface';

export type {
  User,
  LoginRequest,
  LoginResponse,
  TokenInfo,
  AuthorizationContext
} from './auth.interface';