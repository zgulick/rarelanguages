import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TaskFilter, TaskStatus, TaskPriority } from '../../../models';

@Component({
  selector: 'app-task-filter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="task-filter-container">
      <div class="filter-row">
        <mat-form-field appearance="outline">
          <mat-label>Status</mat-label>
          <mat-select [(ngModel)]="filter.status" (selectionChange)="onFilterChange()">
            <mat-option value="">All Statuses</mat-option>
            <mat-option *ngFor="let status of statusOptions" [value]="status.value">
              {{ status.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Priority</mat-label>
          <mat-select [(ngModel)]="filter.priority" (selectionChange)="onFilterChange()">
            <mat-option value="">All Priorities</mat-option>
            <mat-option *ngFor="let priority of priorityOptions" [value]="priority.value">
              {{ priority.label }}
            </mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Assigned To</mat-label>
          <mat-select [(ngModel)]="filter.assignedTo" (selectionChange)="onFilterChange()">
            <mat-option value="">All Assignees</mat-option>
            <mat-option *ngFor="let assignee of assigneeOptions" [value]="assignee">
              {{ assignee }}
            </mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div class="filter-row">
        <mat-form-field appearance="outline">
          <mat-label>Due Date From</mat-label>
          <input matInput [matDatepicker]="fromPicker" [(ngModel)]="filter.dueDateFrom" (dateChange)="onFilterChange()">
          <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
          <mat-datepicker #fromPicker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Due Date To</mat-label>
          <input matInput [matDatepicker]="toPicker" [(ngModel)]="filter.dueDateTo" (dateChange)="onFilterChange()">
          <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
          <mat-datepicker #toPicker></mat-datepicker>
        </mat-form-field>

        <button mat-raised-button color="primary" (click)="clearFilters()">
          <mat-icon>clear</mat-icon>
          Clear Filters
        </button>
      </div>
    </div>
  `,
  styles: [`
    .task-filter-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      background-color: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .filter-row {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    mat-form-field {
      min-width: 150px;
    }

    @media (max-width: 768px) {
      .filter-row {
        flex-direction: column;
        align-items: stretch;
      }
      
      mat-form-field {
        width: 100%;
      }
    }
  `]
})
export class TaskFilterComponent {
  @Input() filter: TaskFilter = {};
  @Output() filterChange = new EventEmitter<TaskFilter>();

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

  assigneeOptions = [
    'John Smith',
    'Jane Doe',
    'Mike Johnson',
    'Sarah Wilson',
    'Robert Brown',
    'Emily Davis'
  ];

  onFilterChange() {
    this.filterChange.emit({ ...this.filter });
  }

  clearFilters() {
    this.filter = {};
    this.filterChange.emit({ ...this.filter });
  }
}