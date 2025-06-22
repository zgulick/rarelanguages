import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { ProcessSummary } from '../../../models';

@Component({
  selector: 'app-sidebar-navigation',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatButtonModule
  ],
  template: `
    <div class="sidebar-navigation">
      <!-- LOCALS Section -->
      <div class="locals-section">
        <h3 class="section-title">LOCALS</h3>
        <div class="locals-info">
          <div class="property-quick-info">
            <mat-icon class="property-icon">location_on</mat-icon>
            <div class="property-details">
              <span class="property-address">{{ currentAssetAddress }}</span>
              <span class="property-type">{{ currentAssetType }}</span>
            </div>
          </div>
          
          <div class="status-summary">
            <mat-chip class="status-chip active">{{ activeProcesses }} Active</mat-chip>
            <mat-chip class="status-chip pending">{{ pendingTasks }} Pending</mat-chip>
          </div>
        </div>
      </div>

      <mat-divider></mat-divider>

      <!-- Process Navigation -->
      <div class="process-navigation">
        <h3 class="section-title">PROCESSES</h3>
        
        <mat-nav-list class="process-list">
          <mat-list-item 
            *ngFor="let process of processes; trackBy: trackByProcessId"
            [class.selected]="selectedProcessId === process.id"
            (click)="onProcessSelect(process)"
            class="process-item"
          >
            <mat-icon matListItemIcon [style.color]="process.color">{{ process.icon }}</mat-icon>
            
            <div matListItemTitle class="process-title">{{ process.name }}</div>
            
            <div matListItemLine class="process-meta">
              <span class="process-type">{{ process.type | titlecase }}</span>
              <mat-chip 
                class="status-indicator"
                [style.background-color]="getStatusColor(process.status)"
              >
                {{ process.status | titlecase }}
              </mat-chip>
            </div>
            
            <div matListItemMeta class="process-progress">
              <div class="progress-info">
                <span class="task-count">{{ process.completedTaskCount }}/{{ process.taskCount }}</span>
                <div class="progress-bar">
                  <div 
                    class="progress-fill"
                    [style.width.%]="getProgressPercentage(process)"
                  ></div>
                </div>
              </div>
            </div>
          </mat-list-item>
        </mat-nav-list>
      </div>

      <mat-divider></mat-divider>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h3 class="section-title">QUICK ACTIONS</h3>
        <div class="action-buttons">
          <button mat-stroked-button class="action-btn" (click)="onCreateTask()">
            <mat-icon>add_task</mat-icon>
            New Task
          </button>
          <button mat-stroked-button class="action-btn" (click)="onGenerateReport()">
            <mat-icon>assessment</mat-icon>
            Report
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .sidebar-navigation {
      width: 100%;
      height: 100%;
      background-color: #fafafa;
      border-right: 1px solid #e0e0e0;
      overflow-y: auto;
      padding: 16px 0;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 1px;
      color: #666;
      margin: 0 0 12px 0;
      padding: 0 16px;
      text-transform: uppercase;
    }

    .locals-section {
      padding: 0 16px 16px 16px;
      
      .locals-info {
        background: white;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .property-quick-info {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 12px;
        
        .property-icon {
          color: var(--primary-color);
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-top: 2px;
        }
        
        .property-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          
          .property-address {
            font-size: 13px;
            font-weight: 500;
            line-height: 1.2;
            color: #333;
          }
          
          .property-type {
            font-size: 11px;
            color: #666;
            margin-top: 2px;
          }
        }
      }
      
      .status-summary {
        display: flex;
        gap: 6px;
        
        .status-chip {
          font-size: 10px;
          height: 20px;
          line-height: 20px;
          
          &.active {
            background-color: #e8f5e8;
            color: #2e7d32;
          }
          
          &.pending {
            background-color: #fff3e0;
            color: #f57c00;
          }
        }
      }
    }

    .process-navigation {
      flex: 1;
      
      .process-list {
        padding: 0;
        
        .process-item {
          padding: 12px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          min-height: 72px;
          
          &:hover {
            background-color: rgba(25, 118, 210, 0.04);
          }
          
          &.selected {
            background-color: rgba(25, 118, 210, 0.08);
            border-left-color: var(--primary-color);
          }
          
          .process-title {
            font-weight: 500;
            font-size: 14px;
            color: #333;
          }
          
          .process-meta {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 4px;
            
            .process-type {
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .status-indicator {
              font-size: 9px;
              height: 18px;
              line-height: 18px;
              color: white;
              font-weight: 500;
            }
          }
          
          .process-progress {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            
            .progress-info {
              display: flex;
              flex-direction: column;
              align-items: flex-end;
              width: 60px;
              
              .task-count {
                font-size: 11px;
                font-weight: 500;
                color: #666;
                margin-bottom: 4px;
              }
              
              .progress-bar {
                width: 100%;
                height: 4px;
                background-color: #e0e0e0;
                border-radius: 2px;
                overflow: hidden;
                
                .progress-fill {
                  height: 100%;
                  background-color: var(--primary-color);
                  transition: width 0.3s ease;
                }
              }
            }
          }
        }
      }
    }

    .quick-actions {
      padding: 16px;
      
      .action-buttons {
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .action-btn {
          width: 100%;
          justify-content: flex-start;
          font-size: 12px;
          height: 36px;
          
          mat-icon {
            margin-right: 8px;
            font-size: 16px;
            width: 16px;
            height: 16px;
          }
        }
      }
    }

    // Responsive adjustments
    @media (max-width: 768px) {
      .sidebar-navigation {
        background-color: white;
      }
    }
  `]
})
export class SidebarNavigationComponent {
  @Input() processes: ProcessSummary[] = [];
  @Input() selectedProcessId: string | null = null;
  @Input() currentAssetAddress = '';
  @Input() currentAssetType = '';

  @Output() processSelect = new EventEmitter<ProcessSummary>();
  @Output() createTask = new EventEmitter<void>();
  @Output() generateReport = new EventEmitter<void>();

  get activeProcesses(): number {
    return this.processes.filter(p => p.status === 'in_progress').length;
  }

  get pendingTasks(): number {
    return this.processes.reduce((sum, p) => sum + (p.taskCount - p.completedTaskCount), 0);
  }

  trackByProcessId(index: number, process: ProcessSummary): string {
    return process.id;
  }

  onProcessSelect(process: ProcessSummary) {
    this.processSelect.emit(process);
  }

  onCreateTask() {
    this.createTask.emit();
  }

  onGenerateReport() {
    this.generateReport.emit();
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

  getProgressPercentage(process: ProcessSummary): number {
    if (process.taskCount === 0) return 0;
    return Math.round((process.completedTaskCount / process.taskCount) * 100);
  }
}