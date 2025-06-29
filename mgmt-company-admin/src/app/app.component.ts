import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatToolbarModule, MatIconModule, MatButtonModule],
  template: `
    <div class="app-layout">
      <!-- Header -->
      <mat-toolbar class="app-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>business</mat-icon>
          </div>
          <div>
            <div class="header-title">{{ getBreadcrumb() }}</div>
            <div class="header-subtitle">{{ getSubtitle() }}</div>
          </div>
        </div>
      </mat-toolbar>

      <!-- Main Content -->
      <div class="app-main">
        <!-- Main Content Area -->
        <div class="main-content">
          <!-- Tabs -->
          <div class="content-tabs" *ngIf="!isCreateOrEditPage()">
            <ul class="nav nav-tabs">
              <li class="nav-item">
                <a class="nav-link active" href="#" (click)="setActiveTab('companies')">
                  <mat-icon>people</mat-icon>
                  Companies
                </a>
              </li>
            </ul>
          </div>

          <!-- Content Body -->
          <div class="content-body">
            <router-outlet></router-outlet>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Management Company Admin';
  activeTab = 'companies';
  currentRoute = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.currentRoute = event.url;
    });
    
    this.currentRoute = this.router.url;
  }

  getBreadcrumb(): string {
    if (this.currentRoute.includes('/create')) {
      return 'Management Company Admin > Add Management Company';
    } else if (this.currentRoute.includes('/edit')) {
      return 'Management Company Admin > Edit Management Company';
    }
    return 'Management Company Admin';
  }

  getSubtitle(): string {
    if (this.currentRoute.includes('/create')) {
      return 'Please enter the details of the Management Company you would like to add';
    } else if (this.currentRoute.includes('/edit')) {
      return 'Edit the details of the selected Management Company';
    }
    return 'View and edit your management companies';
  }

  isCreateOrEditPage(): boolean {
    return this.currentRoute.includes('/create') || this.currentRoute.includes('/edit');
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }
}