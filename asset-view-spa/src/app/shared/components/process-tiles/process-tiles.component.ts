import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProcessSummary } from '../../../models';

@Component({
  selector: 'app-process-tiles',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule
  ],
  template: `
    <div class="process-tiles-container">
      <div class="tiles-header">
        <h2 class="section-title">Process Overview</h2>
        <div class="header-actions">
          <button mat-icon-button (click)="onRefresh()" matTooltip="Refresh processes">
            <mat-icon>refresh</mat-icon>
          </button>
          <button mat-icon-button (click)="onViewSettings()" matTooltip="View settings">
            <mat-icon>settings</mat-icon>
          </button>
        </div>
      </div>
      
      <div class="tiles-grid" [class.loading]="isLoading">
        <mat-card 
          *ngFor="let process of processes; trackBy: trackByProcessId"
          class="process-tile"
          [class.selected]="selectedProcessId === process.id"
          [class.completed]="process.status === 'completed'"
          (click)="onProcessSelect(process)"
          [style.border-top-color]="process.color"
        >
          <!-- Process Header -->
          <mat-card-header class="tile-header">
            <div mat-card-avatar class="process-avatar" [style.background-color]="process.color">
              <mat-icon class="process-icon">{{ process.icon }}</mat-icon>
            </div>
            
            <mat-card-title class="process-name">{{ process.name }}</mat-card-title>
            
            <mat-card-subtitle class="process-type">
              {{ process.type | titlecase }}
            </mat-card-subtitle>
          </mat-card-header>

          <!-- Process Content -->
          <mat-card-content class="tile-content">
            <!-- Status and Progress -->
            <div class="status-section">
              <mat-chip 
                class="status-chip"
                [style.background-color]="getStatusColor(process.status)"
              >
                <mat-icon class="status-icon">{{ getStatusIcon(process.status) }}</mat-icon>
                {{ process.status | titlecase }}
              </mat-chip>
              
              <div class="progress-display">
                <span class="progress-text">{{ process.completedTaskCount }}/{{ process.taskCount }} tasks</span>
                <div class="progress-bar">
                  <div 
                    class="progress-fill"
                    [style.width.%]="getProgressPercentage(process)"
                    [style.background-color]="process.color"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Key Metrics -->
            <div class="metrics-section">
              <div class="metric-item">
                <span class="metric-label">Progress</span>
                <span class="metric-value">{{ getProgressPercentage(process) }}%</span>
              </div>
              
              <div class="metric-item">
                <span class="metric-label">Priority</span>
                <span class="metric-value priority" [attr.data-priority]="getProcessPriority(process)">
                  {{ getProcessPriority(process) | titlecase }}
                </span>
              </div>
            </div>

            <!-- Quick Stats -->
            <div class="quick-stats">
              <div class="stat-item" *ngIf="getOverdueTasks(process) > 0">
                <mat-icon class="warning-icon">warning</mat-icon>
                <span class="stat-text">{{ getOverdueTasks(process) }} overdue</span>
              </div>
              
              <div class="stat-item" *ngIf="getUpcomingTasks(process) > 0">
                <mat-icon class="info-icon">schedule</mat-icon>
                <span class="stat-text">{{ getUpcomingTasks(process) }} due soon</span>
              </div>
            </div>
          </mat-card-content>

          <!-- Process Actions -->
          <mat-card-actions class="tile-actions">
            <button 
              mat-button 
              color="primary" 
              (click)="onViewDetails(process, $event)"
              class="action-btn"
            >
              <mat-icon>visibility</mat-icon>
              View Details
            </button>
            
            <button 
              mat-icon-button 
              (click)="onQuickAction(process, $event)"
              [matTooltip]="getQuickActionTooltip(process)"
              class="quick-action-btn"
            >
              <mat-icon>{{ getQuickActionIcon(process) }}</mat-icon>
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .process-tiles-container {
      padding: 24px;
      background-color: #fafafa;
    }

    .tiles-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      .section-title {
        margin: 0;
        font-size: 24px;
        font-weight: 500;
        color: #333;
      }
      
      .header-actions {
        display: flex;
        gap: 8px;
      }
    }

    .tiles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      transition: opacity 0.3s ease;
      
      &.loading {
        opacity: 0.7;
        pointer-events: none;
      }
    }

    .process-tile {
      position: relative;
      cursor: pointer;
      transition: all 0.3s ease;
      border-top: 4px solid transparent;
      min-height: 280px;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
      }
      
      &.selected {
        box-shadow: 0 8px 24px rgba(25, 118, 210, 0.3);
        border-color: var(--primary-color);
      }
      
      &.completed {
        .tile-header, .tile-content {
          opacity: 0.8;
        }
      }
    }

    .tile-header {
      padding-bottom: 8px;
      
      .process-avatar {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        border-radius: 12px;
        
        .process-icon {
          color: white;
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
      
      .process-name {
        font-size: 18px;
        font-weight: 500;
        line-height: 1.2;
        color: #333;
      }
      
      .process-type {
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 4px;
      }
    }

    .tile-content {
      padding-top: 8px;
    }

    .status-section {
      margin-bottom: 16px;
      
      .status-chip {
        display: flex;
        align-items: center;
        gap: 4px;
        color: white;
        font-weight: 500;
        font-size: 11px;
        height: 24px;
        margin-bottom: 12px;
        
        .status-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }
      
      .progress-display {
        .progress-text {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
          display: block;
        }
        
        .progress-bar {
          width: 100%;
          height: 6px;
          background-color: #e0e0e0;
          border-radius: 3px;
          overflow: hidden;
          
          .progress-fill {
            height: 100%;
            transition: width 0.4s ease;
            border-radius: 3px;
          }
        }
      }
    }

    .metrics-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;
      
      .metric-item {
        display: flex;
        flex-direction: column;
        
        .metric-label {
          font-size: 11px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .metric-value {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          margin-top: 2px;
          
          &.priority {
            &[data-priority="high"] {
              color: #f44336;
            }
            &[data-priority="medium"] {
              color: #ff9800;
            }
            &[data-priority="low"] {
              color: #4caf50;
            }
          }
        }
      }
    }

    .quick-stats {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        
        .warning-icon {
          color: #f57c00;
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
        
        .info-icon {
          color: #2196f3;
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
        
        .stat-text {
          font-size: 11px;
          color: #666;
        }
      }
    }

    .tile-actions {
      padding: 8px 16px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .action-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        
        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
      
      .quick-action-btn {
        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    // Responsive Design
    @media (max-width: 768px) {
      .process-tiles-container {
        padding: 16px;
      }
      
      .tiles-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .tiles-header {
        .section-title {
          font-size: 20px;
        }
      }
    }

    @media (max-width: 480px) {
      .process-tile {
        min-height: 240px;
      }
      
      .metrics-section {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class ProcessTilesComponent {
  @Input() processes: ProcessSummary[] = [];
  @Input() selectedProcessId: string | null = null;
  @Input() isLoading = false;

  @Output() processSelect = new EventEmitter<ProcessSummary>();
  @Output() viewDetails = new EventEmitter<ProcessSummary>();
  @Output() quickAction = new EventEmitter<ProcessSummary>();
  @Output() refresh = new EventEmitter<void>();
  @Output() viewSettings = new EventEmitter<void>();

  trackByProcessId(index: number, process: ProcessSummary): string {
    return process.id;
  }

  onProcessSelect(process: ProcessSummary) {
    this.processSelect.emit(process);
  }

  onViewDetails(process: ProcessSummary, event: Event) {
    event.stopPropagation();
    this.viewDetails.emit(process);
  }

  onQuickAction(process: ProcessSummary, event: Event) {
    event.stopPropagation();
    this.quickAction.emit(process);
  }

  onRefresh() {
    this.refresh.emit();
  }

  onViewSettings() {
    this.viewSettings.emit();
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'completed': '#4CAF50',
      'in_progress': '#FF9800',
      'not_started': '#9E9E9E',
      'on_hold': '#F44336',
      'cancelled': '#424242'
    };
    return colors[status] || '#9E9E9E';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'completed': 'check_circle',
      'in_progress': 'schedule',
      'not_started': 'radio_button_unchecked',
      'on_hold': 'pause_circle',
      'cancelled': 'cancel'
    };
    return icons[status] || 'help';
  }

  getProgressPercentage(process: ProcessSummary): number {
    if (process.taskCount === 0) return 0;
    return Math.round((process.completedTaskCount / process.taskCount) * 100);
  }

  getProcessPriority(process: ProcessSummary): string {
    // Mock priority based on process type and status
    if (process.type === 'compliance' || process.type === 'inspection') return 'high';
    if (process.type === 'maintenance') return 'medium';
    return 'low';
  }

  getOverdueTasks(process: ProcessSummary): number {
    // Mock overdue tasks - in real app this would come from the data
    if (process.status === 'on_hold') return 2;
    if (process.status === 'in_progress' && process.type === 'compliance') return 1;
    return 0;
  }

  getUpcomingTasks(process: ProcessSummary): number {
    // Mock upcoming tasks
    if (process.status === 'in_progress') return Math.max(0, process.taskCount - process.completedTaskCount - 1);
    return 0;
  }

  getQuickActionIcon(process: ProcessSummary): string {
    if (process.status === 'completed') return 'download';
    if (process.status === 'on_hold') return 'play_arrow';
    return 'add_task';
  }

  getQuickActionTooltip(process: ProcessSummary): string {
    if (process.status === 'completed') return 'Download report';
    if (process.status === 'on_hold') return 'Resume process';
    return 'Add new task';
  }
}