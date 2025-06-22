export interface Task {
  id: string;
  processId: string;
  assetId: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: Date;
  completedDate?: Date;
  createdDate: Date;
  updatedDate: Date;
  tags: string[];
  attachments: TaskAttachment[];
  comments?: TaskComment[];
  estimatedHours?: number;
  actualHours?: number;
}

export interface TaskSummary {
  id: string;
  processId: string;
  name: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo?: string;
  dueDate?: Date;
  tags: string[];
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedDate: Date;
}

export interface TaskComment {
  id: string;
  text: string;
  author: string;
  createdDate: Date;
  updatedDate?: Date;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  BLOCKED = 'blocked'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignedTo?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  tags?: string[];
}

export interface TaskSort {
  field: keyof Task;
  direction: 'asc' | 'desc';
}