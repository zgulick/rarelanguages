export interface Process {
  id: string;
  name: string;
  description: string;
  type: ProcessType;
  status: ProcessStatus;
  keyFields: ProcessKeyField[];
  tasks: string[]; // Task IDs
  color: string;
  icon: string;
  order: number;
}

export interface ProcessKeyField {
  id: string;
  name: string;
  value: string | number | boolean | Date;
  type: FieldType;
  label: string;
  required: boolean;
  editable: boolean;
}

export interface ProcessSummary {
  id: string;
  name: string;
  type: ProcessType;
  status: ProcessStatus;
  taskCount: number;
  completedTaskCount: number;
  color: string;
  icon: string;
}

export enum ProcessType {
  INSPECTION = 'inspection',
  MAINTENANCE = 'maintenance',
  COMPLIANCE = 'compliance',
  TENANT_MANAGEMENT = 'tenant_management',
  FINANCIAL = 'financial',
  LEGAL = 'legal'
}

export enum ProcessStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  TEXTAREA = 'textarea'
}