/**
 * Task-related interfaces for enterprise task management
 * Comprehensive task modeling with workflow integration
 */

import { AuditableEntity, Priority } from './common.interface';
import { ProcessEvent, StakeholderRole } from './process.interface';

export interface Task extends AuditableEntity {
  taskNumber: string;
  name: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  priority: Priority;
  processId: string;
  parentTaskId?: string;
  assignedTo?: string;
  assignedTeam?: string;
  reporter?: string;
  dueDate?: Date;
  startDate?: Date;
  completedDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage: number;
  tags: string[];
  attachments: TaskAttachment[];
  comments: TaskComment[];
  timeEntries: TimeEntry[];
  dependencies: TaskDependency[];
  checklistItems: ChecklistItem[];
  customFields: Record<string, any>;
  metadata?: TaskMetadata;
}

export enum TaskType {
  INSPECTION = 'inspection',
  DOCUMENTATION = 'documentation',
  REVIEW = 'review',
  APPROVAL = 'approval',
  FIELD_WORK = 'field_work',
  ANALYSIS = 'analysis',
  COMMUNICATION = 'communication',
  TRAINING = 'training',
  MAINTENANCE = 'maintenance',
  ADMINISTRATIVE = 'administrative'
}

export enum TaskStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  AWAITING_ASSIGNMENT = 'awaiting_assignment',
  AWAITING_APPROVAL = 'awaiting_approval',
  AWAITING_INFORMATION = 'awaiting_information',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  DELEGATED = 'delegated'
}

export interface TaskAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: Date;
  uploadedBy: string;
  description?: string;
  category?: AttachmentCategory;
}

export enum AttachmentCategory {
  DOCUMENT = 'document',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  SPREADSHEET = 'spreadsheet',
  PRESENTATION = 'presentation',
  PDF = 'pdf',
  OTHER = 'other'
}

export interface TaskComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: Date;
  updatedAt?: Date;
  isInternal: boolean;
  parentCommentId?: string;
  mentions: string[]; // User IDs mentioned in the comment
  attachments?: TaskAttachment[];
}

export interface TimeEntry {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // in minutes
  description?: string;
  billable: boolean;
  rate?: number;
  category?: TimeEntryCategory;
  approvedBy?: string;
  approvedAt?: Date;
}

export enum TimeEntryCategory {
  INVESTIGATION = 'investigation',
  DOCUMENTATION = 'documentation',
  TRAVEL = 'travel',
  MEETING = 'meeting',
  ANALYSIS = 'analysis',
  REPORT_WRITING = 'report_writing',
  FIELD_WORK = 'field_work',
  ADMINISTRATIVE = 'administrative'
}

export interface TaskDependency {
  dependentTaskId: string;
  dependencyType: TaskDependencyType;
  isBlocking: boolean;
  condition?: string;
}

export enum TaskDependencyType {
  FINISH_TO_START = 'finish_to_start',
  START_TO_START = 'start_to_start',
  FINISH_TO_FINISH = 'finish_to_finish',
  START_TO_FINISH = 'start_to_finish'
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  completedAt?: Date;
  completedBy?: string;
  order: number;
  isRequired: boolean;
  metadata?: Record<string, any>;
}

export interface TaskMetadata {
  complexity: TaskComplexity;
  skillsRequired: string[];
  toolsRequired: string[];
  location?: TaskLocation;
  weatherDependent: boolean;
  safetyRequirements?: string[];
  qualityChecks?: QualityCheck[];
}

export enum TaskComplexity {
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  EXPERT = 'expert'
}

export interface TaskLocation {
  type: 'on_site' | 'office' | 'remote' | 'multiple';
  address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  accessInstructions?: string;
}

export interface QualityCheck {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  checkType: QualityCheckType;
  criteria: QualityCheckCriteria[];
  passThreshold?: number;
}

export enum QualityCheckType {
  CHECKLIST = 'checklist',
  MEASUREMENT = 'measurement',
  VISUAL_INSPECTION = 'visual_inspection',
  DOCUMENTATION_REVIEW = 'documentation_review',
  STAKEHOLDER_APPROVAL = 'stakeholder_approval'
}

export interface QualityCheckCriteria {
  criterion: string;
  expectedValue?: any;
  tolerance?: number;
  unit?: string;
  isPassed?: boolean;
  actualValue?: any;
  notes?: string;
}

// Task workflow and automation
export interface TaskWorkflow {
  id: string;
  taskId: string;
  currentStep: WorkflowStep;
  steps: WorkflowStep[];
  isAutomated: boolean;
  completedSteps: CompletedWorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  assigneeRole: StakeholderRole;
  estimatedDuration: number;
  order: number;
  conditions?: WorkflowCondition[];
  actions?: WorkflowAction[];
}

export interface WorkflowCondition {
  field: string;
  operator: string;
  value: any;
}

export interface WorkflowAction {
  type: 'notify' | 'assign' | 'update_status' | 'create_subtask';
  parameters: Record<string, any>;
}

export interface CompletedWorkflowStep {
  stepId: string;
  completedAt: Date;
  completedBy: string;
  duration: number;
  outcome: StepOutcome;
  notes?: string;
}

export interface StepOutcome {
  status: 'success' | 'failure' | 'skipped';
  data?: any;
  errors?: string[];
}

// Task analytics and reporting
export interface TaskMetrics {
  taskId: string;
  cycleTime: number; // Total time from creation to completion
  leadTime: number; // Time from assignment to completion
  activeTime: number; // Actual working time
  waitTime: number; // Time spent waiting
  reworkCount: number;
  qualityScore?: number;
  stakeholderSatisfaction?: number;
}

export interface TaskSummary {
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<Priority, number>;
  tasksByType: Record<TaskType, number>;
  overdueTasks: number;
  averageCompletionTime: number;
  onTimeCompletionRate: number;
}

// Search and filtering
export interface TaskSearchCriteria {
  taskNumber?: string;
  name?: string;
  status?: TaskStatus[];
  priority?: Priority[];
  type?: TaskType[];
  assignedTo?: string[];
  processId?: string;
  dueDate?: {
    from?: Date;
    to?: Date;
  };
  tags?: string[];
}

export interface TaskGridColumn {
  field: keyof Task | string;
  header: string;
  sortable: boolean;
  filterable: boolean;
  width?: number;
  type: 'text' | 'date' | 'number' | 'status' | 'priority' | 'custom';
  formatter?: (value: any) => string;
  cellRenderer?: string;
}