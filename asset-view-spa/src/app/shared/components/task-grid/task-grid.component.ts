import { Component, EventEmitter, Input, Output, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { TaskSummary, TaskStatus, TaskPriority } from '../../../models';

@Component({
  selector: 'app-task-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="task-grid-container">
      <!-- Grid Header with Filters and Actions -->
      <div class="grid-header">
        <div class="header-left">
          <h3 class="grid-title">Tasks</h3>
          <span class="task-count">{{ dataSource.filteredData.length }} of {{ totalTasks }} tasks</span>
        </div>
        
        <div class="header-actions">
          <!-- Quick Filters -->
          <div class="quick-filters">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilters()">
                <mat-option value="">All Statuses</mat-option>
                <mat-option *ngFor="let status of statusOptions" [value]="status.value">
                  {{ status.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Priority</mat-label>
              <mat-select [(ngModel)]="priorityFilter" (selectionChange)="applyFilters()">
                <mat-option value="">All Priorities</mat-option>
                <mat-option *ngFor="let priority of priorityOptions" [value]="priority.value">
                  {{ priority.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field appearance="outline" class="search-field">
              <mat-label>Search tasks</mat-label>
              <input matInput [(ngModel)]="searchText" (input)="applyFilters()" placeholder="Task name...">
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>
          </div>
          
          <!-- Action Buttons -->
          <div class="action-buttons">
            <button mat-raised-button color="primary" (click)="onCreateTask()">
              <mat-icon>add</mat-icon>
              New Task
            </button>
            
            <button 
              mat-icon-button 
              [matMenuTriggerFor]="bulkActionsMenu"
              [disabled]="selection.selected.length === 0"
              matTooltip="Bulk actions"
            >
              <mat-icon>more_vert</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Selection Info -->
      <div class="selection-info" *ngIf="selection.selected.length > 0">
        <span>{{ selection.selected.length }} task(s) selected</span>
        <button mat-button (click)="selection.clear()">Clear selection</button>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <table mat-table [dataSource]="dataSource" class="task-table" matSort>
          <!-- Checkbox Column -->
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox
                (change)="$event ? toggleAllRows() : null"
                [checked]="selection.hasValue() && isAllSelected()"
                [indeterminate]="selection.hasValue() && !isAllSelected()"
              ></mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let task">
              <mat-checkbox
                (click)="$event.stopPropagation()"
                (change)="$event ? selection.toggle(task) : null"
                [checked]="selection.isSelected(task)"
              ></mat-checkbox>
            </td>
          </ng-container>

          <!-- Task Name Column -->
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Task Name</th>
            <td mat-cell *matCellDef="let task" class="task-name-cell">
              <div class="task-name-content">
                <span class="task-name">{{ task.name }}</span>
                <div class="task-tags" *ngIf="task.tags.length > 0">
                  <mat-chip *ngFor="let tag of task.tags.slice(0, 2)" class="task-tag">
                    {{ tag }}
                  </mat-chip>
                  <span *ngIf="task.tags.length > 2" class="more-tags">+{{ task.tags.length - 2 }}</span>
                </div>
              </div>
            </td>
          </ng-container>

          <!-- Status Column -->
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
            <td mat-cell *matCellDef="let task">
              <mat-chip 
                class="status-chip"
                [style.background-color]="getStatusColor(task.status)"
                (click)="onStatusChange(task)"
              >
                <mat-icon class="status-icon">{{ getStatusIcon(task.status) }}</mat-icon>
                {{ task.status | titlecase }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Priority Column -->
          <ng-container matColumnDef="priority">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Priority</th>
            <td mat-cell *matCellDef="let task">
              <mat-chip 
                class="priority-chip"
                [attr.data-priority]="task.priority"
              >
                {{ task.priority | titlecase }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Assigned To Column -->
          <ng-container matColumnDef="assignedTo">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Assigned To</th>
            <td mat-cell *matCellDef="let task">
              <div class="assignee-info" *ngIf="task.assignedTo">
                <mat-icon class="assignee-icon">person</mat-icon>
                <span class="assignee-name">{{ task.assignedTo }}</span>
              </div>
              <span *ngIf="!task.assignedTo" class="unassigned">Unassigned</span>
            </td>
          </ng-container>

          <!-- Due Date Column -->
          <ng-container matColumnDef="dueDate">
            <th mat-header-cell *matHeaderCellDef mat-sort-header>Due Date</th>
            <td mat-cell *matCellDef="let task">
              <div class="due-date-info" *ngIf="task.dueDate">
                <span 
                  class="due-date"
                  [class.overdue]="isOverdue(task.dueDate)"
                  [class.due-soon]="isDueSoon(task.dueDate)"
                >
                  {{ task.dueDate | date:'MMM d, y' }}
                </span>
                <mat-icon 
                  *ngIf="isOverdue(task.dueDate)" 
                  class="warning-icon"
                  matTooltip="Overdue"
                >
                  warning
                </mat-icon>
              </div>
              <span *ngIf="!task.dueDate" class="no-due-date">No due date</span>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let task">
              <div class="action-buttons-cell">
                <button 
                  mat-icon-button 
                  (click)="onTaskEdit(task)"
                  matTooltip="Edit task"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                
                <button 
                  mat-icon-button 
                  [matMenuTriggerFor]="taskMenu"
                  (click)="setSelectedTask(task)"
                  matTooltip="More actions"
                >
                  <mat-icon>more_vert</mat-icon>
                </button>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr 
            mat-row 
            *matRowDef="let task; columns: displayedColumns;"
            (click)="onTaskClick(task)"
            class="task-row"
          ></tr>
        </table>
      </div>

      <!-- Pagination -->
      <mat-paginator 
        [pageSizeOptions]="[10, 25, 50, 100]"
        [pageSize]="25"
        [showFirstLastButtons]="true"
      ></mat-paginator>
    </div>

    <!-- Bulk Actions Menu -->
    <mat-menu #bulkActionsMenu="matMenu">
      <button mat-menu-item (click)="onBulkStatusChange(TaskStatus.COMPLETED)">
        <mat-icon>check_circle</mat-icon>
        Mark as Completed
      </button>
      <button mat-menu-item (click)="onBulkStatusChange(TaskStatus.IN_PROGRESS)">
        <mat-icon>schedule</mat-icon>
        Mark as In Progress
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="onBulkAssign()">
        <mat-icon>person_add</mat-icon>
        Assign Tasks
      </button>
      <button mat-menu-item (click)="onBulkDelete()">
        <mat-icon>delete</mat-icon>
        Delete Tasks
      </button>
    </mat-menu>

    <!-- Task Actions Menu -->
    <mat-menu #taskMenu="matMenu">
      <button mat-menu-item (click)="onTaskView(selectedTask)">
        <mat-icon>visibility</mat-icon>
        View Details
      </button>
      <button mat-menu-item (click)="onTaskDuplicate(selectedTask)">
        <mat-icon>content_copy</mat-icon>
        Duplicate
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="onTaskDelete(selectedTask)">
        <mat-icon>delete</mat-icon>
        Delete
      </button>
    </mat-menu>
  `,
  styles: [`
    .task-grid-container {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .grid-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e0e0e0;
      background-color: #fafafa;
      
      .header-left {
        display: flex;
        align-items: baseline;
        gap: 16px;
        
        .grid-title {
          margin: 0;
          font-size: 20px;
          font-weight: 500;
          color: #333;
        }
        
        .task-count {
          font-size: 14px;
          color: #666;
        }
      }
      
      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
        
        .quick-filters {
          display: flex;
          gap: 12px;
          
          .filter-field, .search-field {
            width: 140px;
            
            ::ng-deep .mat-mdc-form-field-subscript-wrapper {
              display: none;
            }
          }
          
          .search-field {
            width: 200px;
          }
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
          
          button {
            height: 40px;
          }
        }
      }
    }

    .selection-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 24px;
      background-color: #e3f2fd;
      border-bottom: 1px solid #e0e0e0;
      font-size: 14px;
      color: #1976d2;
    }

    .table-container {
      overflow-x: auto;
      max-height: 600px;
      
      .task-table {
        width: 100%;
        
        .mat-mdc-header-cell {
          font-weight: 500;
          color: #333;
          background-color: #f8f9fa;
        }
        
        .task-row {
          cursor: pointer;
          transition: background-color 0.2s ease;
          
          &:hover {
            background-color: #f5f5f5;
          }
        }
        
        .task-name-cell {
          max-width: 300px;
          
          .task-name-content {
            .task-name {
              font-weight: 500;
              color: #333;
              display: block;
              margin-bottom: 4px;
            }
            
            .task-tags {
              display: flex;
              gap: 4px;
              align-items: center;
              
              .task-tag {
                font-size: 10px;
                height: 18px;
                line-height: 18px;
                background-color: #f0f0f0;
                color: #666;
              }
              
              .more-tags {
                font-size: 11px;
                color: #999;
              }
            }
          }
        }
        
        .status-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          color: white;
          font-weight: 500;
          font-size: 11px;
          cursor: pointer;
          
          .status-icon {
            font-size: 14px;
            width: 14px;
            height: 14px;
          }
        }
        
        .priority-chip {
          font-size: 11px;
          font-weight: 500;
          
          &[data-priority="urgent"] {
            background-color: #ffebee;
            color: #c62828;
          }
          &[data-priority="high"] {
            background-color: #fff3e0;
            color: #e65100;
          }
          &[data-priority="medium"] {
            background-color: #e3f2fd;
            color: #1565c0;
          }
          &[data-priority="low"] {
            background-color: #e8f5e8;
            color: #2e7d32;
          }
        }
        
        .assignee-info {
          display: flex;
          align-items: center;
          gap: 6px;
          
          .assignee-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #666;
          }
          
          .assignee-name {
            font-size: 13px;
            color: #333;
          }
        }
        
        .unassigned {
          font-size: 13px;
          color: #999;
          font-style: italic;
        }
        
        .due-date-info {
          display: flex;
          align-items: center;
          gap: 6px;
          
          .due-date {
            font-size: 13px;
            
            &.overdue {
              color: #d32f2f;
              font-weight: 500;
            }
            
            &.due-soon {
              color: #f57c00;
              font-weight: 500;
            }
          }
          
          .warning-icon {
            font-size: 16px;
            width: 16px;
            height: 16px;
            color: #d32f2f;
          }
        }
        
        .no-due-date {
          font-size: 13px;
          color: #999;
          font-style: italic;
        }
        
        .action-buttons-cell {
          display: flex;
          gap: 4px;
        }
      }
    }

    // Responsive Design
    @media (max-width: 768px) {
      .grid-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
        
        .header-actions {
          flex-direction: column;
          gap: 12px;
          
          .quick-filters {
            flex-wrap: wrap;
          }
        }
      }
      
      .task-table {
        .task-name-cell {
          max-width: 200px;
        }
      }
    }
  `]
})
export class TaskGridComponent implements OnInit {
  TaskStatus = TaskStatus;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  @Input() tasks: TaskSummary[] = [];
  @Input() isLoading = false;

  @Output() taskClick = new EventEmitter<TaskSummary>();
  @Output() taskEdit = new EventEmitter<TaskSummary>();
  @Output() taskDelete = new EventEmitter<TaskSummary>();
  @Output() statusChange = new EventEmitter<{task: TaskSummary, status: TaskStatus}>();
  @Output() createTask = new EventEmitter<void>();

  displayedColumns: string[] = ['select', 'name', 'status', 'priority', 'assignedTo', 'dueDate', 'actions'];
  dataSource = new MatTableDataSource<TaskSummary>();
  selection = new SelectionModel<TaskSummary>(true, []);
  
  selectedTask: TaskSummary | null = null;
  searchText = '';
  statusFilter = '';
  priorityFilter = '';
  totalTasks = 0;

  statusOptions = [
    { value: TaskStatus.TODO, label: 'To Do' },
    { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
    { value: TaskStatus.REVIEW, label: 'Review' },
    { value: TaskStatus.COMPLETED, label: 'Completed' },
    { value: TaskStatus.CANCELLED, label: 'Cancelled' },
    { value: TaskStatus.BLOCKED, label: 'Blocked' }
  ];

  priorityOptions = [
    { value: TaskPriority.LOW, label: 'Low' },
    { value: TaskPriority.MEDIUM, label: 'Medium' },
    { value: TaskPriority.HIGH, label: 'High' },
    { value: TaskPriority.URGENT, label: 'Urgent' }
  ];

  ngOnInit() {
    this.updateDataSource();
  }

  ngOnChanges() {
    this.updateDataSource();
  }

  private updateDataSource() {
    this.dataSource.data = this.tasks;
    this.totalTasks = this.tasks.length;
    
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
    
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    
    this.applyFilters();
  }

  applyFilters() {
    this.dataSource.filterPredicate = (task: TaskSummary, filter: string) => {
      const searchMatch = !this.searchText || 
        task.name.toLowerCase().includes(this.searchText.toLowerCase());
      
      const statusMatch = !this.statusFilter || task.status === this.statusFilter;
      const priorityMatch = !this.priorityFilter || task.priority === this.priorityFilter;
      
      return searchMatch && statusMatch && priorityMatch;
    };
    
    this.dataSource.filter = 'trigger'; // Trigger filter
  }

  onTaskClick(task: TaskSummary) {
    this.taskClick.emit(task);
  }

  onTaskEdit(task: TaskSummary) {
    this.taskEdit.emit(task);
  }

  onTaskView(task: TaskSummary | null) {
    if (task) {
      this.onTaskClick(task);
    }
  }

  onTaskDuplicate(task: TaskSummary | null) {
    // Implementation for task duplication
  }

  onTaskDelete(task: TaskSummary | null) {
    if (task) {
      this.taskDelete.emit(task);
    }
  }

  onStatusChange(task: TaskSummary) {
    // Cycle through statuses or show status selector
    const statusCycle = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW, TaskStatus.COMPLETED];
    const currentIndex = statusCycle.indexOf(task.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    this.statusChange.emit({ task, status: nextStatus });
  }

  onCreateTask() {
    this.createTask.emit();
  }

  setSelectedTask(task: TaskSummary) {
    this.selectedTask = task;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource.data);
  }

  onBulkStatusChange(status: TaskStatus) {
    // Emit bulk status change for selected tasks
    this.selection.selected.forEach(task => {
      this.statusChange.emit({ task, status });
    });
    this.selection.clear();
  }

  onBulkAssign() {
    // Implementation for bulk assignment
  }

  onBulkDelete() {
    // Implementation for bulk deletion
    this.selection.selected.forEach(task => {
      this.taskDelete.emit(task);
    });
    this.selection.clear();
  }

  getStatusColor(status: TaskStatus): string {
    const colors: Record<string, string> = {
      [TaskStatus.TODO]: '#9e9e9e',
      [TaskStatus.IN_PROGRESS]: '#2196f3',
      [TaskStatus.REVIEW]: '#ff9800',
      [TaskStatus.COMPLETED]: '#4caf50',
      [TaskStatus.CANCELLED]: '#f44336',
      [TaskStatus.BLOCKED]: '#9c27b0'
    };
    return colors[status] || '#9e9e9e';
  }

  getStatusIcon(status: TaskStatus): string {
    const icons: Record<string, string> = {
      [TaskStatus.TODO]: 'radio_button_unchecked',
      [TaskStatus.IN_PROGRESS]: 'schedule',
      [TaskStatus.REVIEW]: 'rate_review',
      [TaskStatus.COMPLETED]: 'check_circle',
      [TaskStatus.CANCELLED]: 'cancel',
      [TaskStatus.BLOCKED]: 'block'
    };
    return icons[status] || 'help';
  }

  isOverdue(dueDate: Date): boolean {
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  }

  isDueSoon(dueDate: Date): boolean {
    const today = new Date();
    const due = new Date(dueDate);
    const daysDiff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysDiff >= 0 && daysDiff <= 3;
  }
}