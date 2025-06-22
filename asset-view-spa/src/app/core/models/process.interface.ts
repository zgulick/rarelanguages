/**
 * Process-related interfaces for enterprise workflow management
 * Demonstrates sophisticated business process modeling
 */

import { AuditableEntity, EntityStatus, Priority, BusinessRule } from './common.interface';

export interface Process extends AuditableEntity {
  name: string;
  type: ProcessType;
  description?: string;
  status: ProcessStatus;
  priority: Priority;
  assetId: string;
  parentProcessId?: string;
  assignedTo?: string;
  assignedTeam?: string;
  startDate?: Date;
  endDate?: Date;
  estimatedDuration?: number; // in days
  actualDuration?: number; // in days
  completionPercentage: number;
  keyFields: ProcessKeyField[];
  businessRules: BusinessRule[];
  metadata?: ProcessMetadata;
  stakeholders: ProcessStakeholder[];
  dependencies: ProcessDependency[];
  outcomes?: ProcessOutcome[];
}

export enum ProcessType {
  CERTIFICATION = 'certification',
  AUDIT = 'audit',
  INSPECTION = 'inspection',
  COMPLIANCE_REVIEW = 'compliance_review',
  MAINTENANCE = 'maintenance',
  DOCUMENTATION = 'documentation',
  TRAINING = 'training',
  ASSESSMENT = 'assessment'
}

export enum ProcessStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  WAITING_FOR_APPROVAL = 'waiting_for_approval',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  ON_INSPECTION_CYCLE = 'on_inspection_cycle'
}

export interface ProcessKeyField {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  value: any;
  isRequired: boolean;
  isEditable: boolean;
  validation?: FieldValidation;
  metadata?: FieldMetadata;
  displayOrder: number;
  groupName?: string;
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  URL = 'url',
  PHONE = 'phone',
  FILE = 'file',
  CURRENCY = 'currency',
  PERCENTAGE = 'percentage'
}

export interface FieldValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
  customValidator?: string;
  errorMessage?: string;
}

export interface FieldMetadata {
  helpText?: string;
  placeholder?: string;
  options?: SelectOption[];
  dependsOn?: string[]; // Other field IDs this field depends on
  conditionalLogic?: ConditionalLogic;
}

export interface SelectOption {
  value: any;
  label: string;
  description?: string;
  isDisabled?: boolean;
  metadata?: Record<string, any>;
}

export interface ConditionalLogic {
  condition: string; // Expression to evaluate
  actions: ConditionalAction[];
}

export interface ConditionalAction {
  type: 'show' | 'hide' | 'enable' | 'disable' | 'setValue' | 'addOption' | 'removeOption';
  target?: string; // Field ID
  value?: any;
}

export interface ProcessMetadata {
  category: string;
  subcategory?: string;
  tags: string[];
  customAttributes: Record<string, any>;
  automationLevel: 'manual' | 'semi_automated' | 'fully_automated';
  criticality: 'low' | 'medium' | 'high' | 'critical';
}

export interface ProcessStakeholder {
  userId: string;
  role: StakeholderRole;
  permissions: StakeholderPermission[];
  notificationPreferences: NotificationPreference[];
}

export enum StakeholderRole {
  OWNER = 'owner',
  ASSIGNEE = 'assignee',
  REVIEWER = 'reviewer',
  APPROVER = 'approver',
  OBSERVER = 'observer',
  AUDITOR = 'auditor'
}

export enum StakeholderPermission {
  VIEW = 'view',
  EDIT = 'edit',
  APPROVE = 'approve',
  REJECT = 'reject',
  REASSIGN = 'reassign',
  DELETE = 'delete',
  COMMENT = 'comment'
}

export interface NotificationPreference {
  event: ProcessEvent;
  method: NotificationMethod[];
  isEnabled: boolean;
}

export enum ProcessEvent {
  CREATED = 'created',
  STARTED = 'started',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  ASSIGNED = 'assigned',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMMENTED = 'commented'
}

export enum NotificationMethod {
  EMAIL = 'email',
  SMS = 'sms',
  IN_APP = 'in_app',
  WEBHOOK = 'webhook'
}

export interface ProcessDependency {
  dependentProcessId: string;
  dependencyType: DependencyType;
  isBlocking: boolean;
  condition?: string; // Condition that must be met
}

export enum DependencyType {
  FINISH_TO_START = 'finish_to_start',
  START_TO_START = 'start_to_start',
  FINISH_TO_FINISH = 'finish_to_finish',
  START_TO_FINISH = 'start_to_finish',
  CONDITIONAL = 'conditional'
}

export interface ProcessOutcome {
  id: string;
  type: OutcomeType;
  description: string;
  value?: any;
  metadata?: Record<string, any>;
  achievedAt: Date;
}

export enum OutcomeType {
  SUCCESS = 'success',
  FAILURE = 'failure',
  PARTIAL_SUCCESS = 'partial_success',
  WARNING = 'warning',
  INFORMATION = 'information'
}

// Process template and workflow interfaces
export interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  type: ProcessType;
  version: string;
  isActive: boolean;
  keyFieldTemplates: ProcessKeyFieldTemplate[];
  workflowSteps: WorkflowStep[];
  businessRules: BusinessRule[];
  estimatedDuration: number;
  requiredRoles: StakeholderRole[];
}

export interface ProcessKeyFieldTemplate {
  name: string;
  label: string;
  type: FieldType;
  isRequired: boolean;
  defaultValue?: any;
  validation?: FieldValidation;
  metadata?: FieldMetadata;
  displayOrder: number;
  groupName?: string;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  stepType: WorkflowStepType;
  assigneeRole: StakeholderRole;
  estimatedDuration: number;
  isRequired: boolean;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
  order: number;
}

export enum WorkflowStepType {
  TASK = 'task',
  APPROVAL = 'approval',
  REVIEW = 'review',
  NOTIFICATION = 'notification',
  AUTOMATED = 'automated',
  DECISION = 'decision'
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface WorkflowAction {
  type: 'assign' | 'notify' | 'update_field' | 'create_task' | 'send_email';
  parameters: Record<string, any>;
}

// Process analytics and reporting
export interface ProcessMetrics {
  processId: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
  qualityScore?: number;
  stakeholderSatisfaction?: number;
}