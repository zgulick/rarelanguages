import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule
  ],
  template: `
    <mat-toolbar class="app-header" color="primary">
      <!-- Logo Section -->
      <div class="logo-section">
        <mat-icon class="logo-icon">business</mat-icon>
        <span class="app-title">AssetView</span>
      </div>

      <!-- Central Search Bar -->
      <div class="search-section">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Search Asset Number</mat-label>
          <input 
            matInput 
            [(ngModel)]="searchValue"
            (ngModelChange)="onSearchChange($event)"
            (keyup.enter)="onSearchSubmit()"
            placeholder="e.g., AST-2024-0001"
            autocomplete="off"
          >
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
      </div>

      <!-- User Menu Section -->
      <div class="user-section">
        <!-- Notifications -->
        <button mat-icon-button [matMenuTriggerFor]="notificationMenu">
          <mat-icon [matBadge]="notificationCount" matBadgeColor="warn">notifications</mat-icon>
        </button>
        
        <!-- User Menu -->
        <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-avatar">
          <mat-icon>account_circle</mat-icon>
        </button>
        
        <!-- User Status -->
        <span class="user-info">
          <span class="user-name">{{ userName }}</span>
          <span class="user-role">{{ userRole }}</span>
        </span>
      </div>
    </mat-toolbar>

    <!-- Notification Menu -->
    <mat-menu #notificationMenu="matMenu" class="notification-menu">
      <button mat-menu-item *ngFor="let notification of notifications">
        <mat-icon [color]="notification.type">{{ notification.icon }}</mat-icon>
        <span>{{ notification.message }}</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item>
        <mat-icon>settings</mat-icon>
        <span>Notification Settings</span>
      </button>
    </mat-menu>

    <!-- User Menu -->
    <mat-menu #userMenu="matMenu" class="user-menu">
      <button mat-menu-item>
        <mat-icon>person</mat-icon>
        <span>Profile</span>
      </button>
      <button mat-menu-item>
        <mat-icon>settings</mat-icon>
        <span>Settings</span>
      </button>
      <mat-divider></mat-divider>
      <button mat-menu-item (click)="onLogout()">
        <mat-icon>exit_to_app</mat-icon>
        <span>Logout</span>
      </button>
    </mat-menu>
  `,
  styles: [`
    .app-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .logo-section {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 200px;
      
      .logo-icon {
        font-size: 28px;
        width: 28px;
        height: 28px;
      }
      
      .app-title {
        font-size: 20px;
        font-weight: 500;
        letter-spacing: 0.5px;
      }
    }

    .search-section {
      flex: 1;
      display: flex;
      justify-content: center;
      max-width: 600px;
      margin: 0 32px;
      
      .search-field {
        width: 100%;
        max-width: 400px;
        
        ::ng-deep .mat-mdc-form-field-subscript-wrapper {
          display: none;
        }
        
        ::ng-deep .mat-mdc-text-field-wrapper {
          background-color: rgba(255, 255, 255, 0.15);
          border-radius: 8px;
        }
        
        ::ng-deep .mat-mdc-form-field-input-control {
          color: white;
        }
        
        ::ng-deep .mat-mdc-floating-label {
          color: rgba(255, 255, 255, 0.8);
        }
        
        ::ng-deep .mat-mdc-form-field-icon-suffix {
          color: rgba(255, 255, 255, 0.8);
        }

        ::ng-deep .mat-mdc-outline {
          color: rgba(255, 255, 255, 0.3);
        }

        ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-outline {
          color: rgba(255, 255, 255, 0.8);
        }
      }
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 16px;
      min-width: 200px;
      justify-content: flex-end;
      
      .user-avatar {
        mat-icon {
          font-size: 32px;
          width: 32px;
          height: 32px;
        }
      }
      
      .user-info {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        
        .user-name {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.2;
        }
        
        .user-role {
          font-size: 12px;
          opacity: 0.8;
          line-height: 1.2;
        }
      }
    }

    .notification-menu, .user-menu {
      ::ng-deep .mat-mdc-menu-content {
        min-width: 200px;
      }
    }

    // Responsive Design
    @media (max-width: 768px) {
      .app-header {
        padding: 0 16px;
      }
      
      .logo-section {
        min-width: 120px;
        
        .app-title {
          font-size: 16px;
        }
      }
      
      .search-section {
        margin: 0 16px;
        
        .search-field {
          max-width: 250px;
        }
      }
      
      .user-info {
        display: none;
      }
    }

    @media (max-width: 480px) {
      .search-section {
        margin: 0 8px;
        
        .search-field {
          max-width: 180px;
        }
      }
    }
  `]
})
export class HeaderComponent {
  @Input() searchValue = '';
  @Input() userName = 'Demo User';
  @Input() userRole = 'Property Manager';
  @Input() notificationCount = 3;

  @Output() searchChange = new EventEmitter<string>();
  @Output() searchSubmit = new EventEmitter<string>();
  @Output() logout = new EventEmitter<void>();

  notifications = [
    {
      type: 'warn',
      icon: 'warning',
      message: 'Inspection overdue for AST-2024-0003'
    },
    {
      type: 'primary',
      icon: 'info',
      message: 'New maintenance request submitted'
    },
    {
      type: 'accent',
      icon: 'assignment',
      message: 'Compliance review scheduled'
    }
  ];

  onSearchChange(value: string) {
    this.searchChange.emit(value);
  }

  onSearchSubmit() {
    this.searchSubmit.emit(this.searchValue);
  }

  onLogout() {
    this.logout.emit();
  }
}