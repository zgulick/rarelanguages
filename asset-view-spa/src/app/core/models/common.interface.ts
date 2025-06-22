/**
 * Common interfaces and types used across the application
 * Demonstrates enterprise-level type safety and data modeling
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  timestamp: Date;
  requestId: string;
  pagination?: PaginationMeta;
  total?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AuditableEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
  version: number;
}

export interface FilterCriteria {
  field: string;
  operator: FilterOperator;
  value: any;
  type?: 'string' | 'number' | 'date' | 'boolean';
}

export type FilterOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'startsWith' 
  | 'endsWith'
  | 'greaterThan' 
  | 'lessThan' 
  | 'greaterThanOrEqual' 
  | 'lessThanOrEqual'
  | 'in' 
  | 'notIn' 
  | 'isNull' 
  | 'isNotNull';

export interface SortCriteria {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchCriteria {
  query?: string;
  filters?: FilterCriteria[];
  sort?: SortCriteria[];
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export interface CacheableEntity extends AuditableEntity {
  cacheKey: string;
  ttl?: number; // Time to live in seconds
}

export enum EntityStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  ARCHIVED = 'archived',
  DELETED = 'deleted'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  conditions: BusinessRuleCondition[];
  actions: BusinessRuleAction[];
}

export interface BusinessRuleCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface BusinessRuleAction {
  type: 'validate' | 'transform' | 'notify' | 'workflow';
  parameters: Record<string, any>;
}