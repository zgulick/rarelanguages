import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, Subject, BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { ProcessTemplateService, ProcessTemplate, ProcessTemplateSearchParams, ProcessTemplateSearchResult } from '../../../core/services/process-template.service';

export interface ProcessTemplateSelection {
  selectedTemplateIds: string[];
  totalSelected: number;
}

@Component({
  selector: 'app-process-template-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="process-template-grid">
      <!-- Header Section -->
      <div class="grid-header">
        <h4 class="section-title">Process Templates</h4>
        <p class="section-description">
          Select pre-built process templates to streamline your property management workflows. 
          You can customize these templates after setup.
        </p>
      </div>

      <!-- Search and Filters -->
      <div class="grid-controls">
        <div class="search-controls">
          <!-- Search Input -->
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search templates...</mat-label>
            <input 
              matInput 
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Search by name, category, or description...">
            <mat-icon matPrefix>search</mat-icon>
            <button 
              mat-icon-button 
              matSuffix
              *ngIf="searchTerm"
              (click)="clearSearch()"
              matTooltip="Clear search">
              <mat-icon>clear</mat-icon>
            </button>
          </mat-form-field>

          <!-- Category Filter -->
          <mat-form-field appearance="outline" class="category-filter">
            <mat-label>Category</mat-label>
            <mat-select [(value)]="selectedCategory" (selectionChange)="onFilterChange()">
              <mat-option value="">All Categories</mat-option>
              <mat-option value="tenant-management">Tenant Management</mat-option>
              <mat-option value="maintenance">Maintenance</mat-option>
              <mat-option value="financial">Financial</mat-option>
              <mat-option value="marketing">Marketing</mat-option>
              <mat-option value="compliance">Compliance</mat-option>
              <mat-option value="reporting">Reporting</mat-option>
            </mat-select>
          </mat-form-field>

          <!-- Complexity Filter -->
          <mat-form-field appearance="outline" class="complexity-filter">
            <mat-label>Complexity</mat-label>
            <mat-select [(value)]="selectedComplexity" (selectionChange)="onFilterChange()">
              <mat-option value="">All Levels</mat-option>
              <mat-option value="simple">Simple</mat-option>
              <mat-option value="moderate">Moderate</mat-option>
              <mat-option value="complex">Complex</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <!-- Selection Summary -->
        <div class="selection-summary">
          <div class="summary-info">
            <span class="selected-count">{{ selectedTemplates.length }} selected</span>
            <span class="total-available" *ngIf="searchResult$ | async as result">
              of {{ result.totalElements }} available
            </span>
          </div>
          <button 
            mat-stroked-button 
            color="primary"
            *ngIf="selectedTemplates.length > 0"
            (click)="clearAllSelections()">
            Clear All
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-container" *ngIf="isLoading">
        <mat-spinner diameter="40"></mat-spinner>
        <p class="loading-text">Loading process templates...</p>
      </div>

      <!-- Templates Grid -->
      <div class="templates-grid" *ngIf="!isLoading && (searchResult$ | async) as result">
        <div 
          *ngFor="let template of result.templates" 
          class="template-card"
          [class.selected]="isSelected(template.id)"
          [class.recommended]="template.isRecommended"
          [class.popular]="template.isPopular">
          
          <!-- Card Header -->
          <div class="card-header">
            <div class="header-content">
              <div class="selection-checkbox">
                <mat-checkbox 
                  [checked]="isSelected(template.id)"
                  (change)="onTemplateToggle(template, $event.checked)"
                  color="primary">
                </mat-checkbox>
              </div>
              
              <div class="template-info">
                <h5 class="template-name">{{ template.name }}</h5>
                <div class="template-meta">
                  <mat-chip class="category-chip">{{ template.category | titlecase }}</mat-chip>
                  <mat-chip 
                    class="complexity-chip"
                    [class.simple]="template.complexity === 'simple'"
                    [class.moderate]="template.complexity === 'moderate'"
                    [class.complex]="template.complexity === 'complex'">
                    {{ template.complexity | titlecase }}
                  </mat-chip>
                </div>
              </div>

              <!-- Template Badges -->
              <div class="template-badges">
                <span class="popular-badge" *ngIf="template.isPopular">Popular</span>
                <span class="recommended-badge" *ngIf="template.isRecommended">Recommended</span>
              </div>
            </div>
          </div>

          <!-- Template Description -->
          <div class="card-description">
            <p class="description-text">{{ template.description }}</p>
          </div>

          <!-- Template Stats -->
          <div class="card-stats">
            <div class="stat-item">
              <mat-icon class="stat-icon">timer</mat-icon>
              <span class="stat-value">{{ template.estimatedDuration }}</span>
              <span class="stat-label">Duration</span>
            </div>
            <div class="stat-item">
              <mat-icon class="stat-icon">playlist_add_check</mat-icon>
              <span class="stat-value">{{ template.stepCount }}</span>
              <span class="stat-label">Steps</span>
            </div>
            <div class="stat-item">
              <mat-icon class="stat-icon">people</mat-icon>
              <span class="stat-value">{{ template.roles.length }}</span>
              <span class="stat-label">Roles</span>
            </div>
          </div>

          <!-- Key Features -->
          <div class="card-features">
            <h6 class="features-title">Key Features</h6>
            <ul class="features-list">
              <li *ngFor="let feature of template.keyFeatures.slice(0, 3)" class="feature-item">
                <mat-icon class="feature-icon">check_circle</mat-icon>
                <span>{{ feature }}</span>
              </li>
              <li *ngIf="template.keyFeatures.length > 3" class="feature-more">
                +{{ template.keyFeatures.length - 3 }} more features
              </li>
            </ul>
          </div>

          <!-- Template Roles -->
          <div class="card-roles" *ngIf="template.roles.length > 0">
            <h6 class="roles-title">Required Roles</h6>
            <div class="roles-chips">
              <mat-chip 
                *ngFor="let role of template.roles.slice(0, 3)" 
                class="role-chip">
                {{ role }}
              </mat-chip>
              <mat-chip 
                *ngIf="template.roles.length > 3"
                class="more-roles-chip">
                +{{ template.roles.length - 3 }}
              </mat-chip>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="card-actions">
            <button 
              mat-flat-button 
              [color]="isSelected(template.id) ? 'warn' : 'primary'"
              (click)="onTemplateToggle(template, !isSelected(template.id))"
              class="action-button">
              {{ isSelected(template.id) ? 'Remove' : 'Select Template' }}
            </button>
            
            <button 
              mat-stroked-button 
              color="primary"
              (click)="previewTemplate(template)"
              class="preview-button">
              <mat-icon>visibility</mat-icon>
              Preview
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination-container" *ngIf="!isLoading && (searchResult$ | async) as result">
        <mat-paginator
          [length]="result.totalElements"
          [pageSize]="pageSize"
          [pageIndex]="currentPage"
          [pageSizeOptions]="[6, 12, 24, 48]"
          [showFirstLastButtons]="true"
          (page)="onPageChange($event)"
          aria-label="Select page of process templates">
        </mat-paginator>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!isLoading && (searchResult$ | async)?.templates.length === 0">
        <mat-icon class="empty-icon">search_off</mat-icon>
        <h6 class="empty-title">No templates found</h6>
        <p class="empty-description">
          Try adjusting your search criteria or filters to find more templates.
        </p>
        <button 
          mat-stroked-button 
          color="primary"
          (click)="clearAllFilters()">
          Clear Filters
        </button>
      </div>

      <!-- Selection Summary -->
      <div class="selection-panel" *ngIf="selectedTemplates.length > 0">
        <div class="panel-card">
          <div class="panel-header">
            <div class="panel-info">
              <mat-icon class="panel-icon">playlist_add_check</mat-icon>
              <div class="panel-details">
                <h6 class="panel-title">Selected Templates</h6>
                <p class="panel-description">
                  {{ selectedTemplates.length }} process template{{ selectedTemplates.length !== 1 ? 's' : '' }} selected for your management company.
                </p>
              </div>
            </div>
            
            <div class="panel-actions">
              <button 
                mat-flat-button 
                color="primary"
                (click)="proceedWithSelection()"
                [disabled]="selectedTemplates.length === 0">
                Proceed with Templates
              </button>
            </div>
          </div>

          <!-- Selected Templates Summary -->
          <div class="selected-templates-summary">
            <div class="summary-grid">
              <div 
                *ngFor="let template of getSelectedTemplateDetails().slice(0, 6)" 
                class="summary-item">
                <span class="summary-name">{{ template.name }}</span>
                <mat-chip class="summary-category">{{ template.category }}</mat-chip>
              </div>
              <div 
                *ngIf="selectedTemplates.length > 6"
                class="summary-more">
                +{{ selectedTemplates.length - 6 }} more templates selected
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./process-template-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProcessTemplateGridComponent implements OnInit, OnDestroy {
  @Input() initialSelection: ProcessTemplateSelection | null = null;
  @Output() selectionChange = new EventEmitter<ProcessTemplateSelection>();

  private destroy$ = new Subject<void>();
  private searchTermSubject = new BehaviorSubject<string>('');
  private filtersSubject = new BehaviorSubject<{ category: string; complexity: string }>({ category: '', complexity: '' });
  private pageSubject = new BehaviorSubject<{ page: number; size: number }>({ page: 0, size: 12 });

  selectedTemplates: string[] = [];
  searchTerm = '';
  selectedCategory = '';
  selectedComplexity = '';
  currentPage = 0;
  pageSize = 12;
  isLoading = false;

  searchResult$: Observable<ProcessTemplateSearchResult>;

  constructor(
    private processTemplateService: ProcessTemplateService,
    private snackBar: MatSnackBar
  ) {
    // Combine search, filters, and pagination to trigger API calls
    this.searchResult$ = combineLatest([
      this.searchTermSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.filtersSubject.pipe(distinctUntilChanged()),
      this.pageSubject.pipe(distinctUntilChanged())
    ]).pipe(
      switchMap(([searchTerm, filters, pagination]) => {
        this.isLoading = true;
        
        const params: ProcessTemplateSearchParams = {
          search: searchTerm,
          category: filters.category,
          complexity: filters.complexity as any,
          page: pagination.page,
          size: pagination.size
        };

        return this.processTemplateService.searchProcessTemplates(params);
      }),
      takeUntil(this.destroy$)
    );

    // Subscribe to loading state
    this.searchResult$.subscribe(() => {
      this.isLoading = false;
    });
  }

  ngOnInit(): void {
    if (this.initialSelection) {
      this.selectedTemplates = [...this.initialSelection.selectedTemplateIds];
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(): void {
    this.searchTermSubject.next(this.searchTerm);
    this.resetToFirstPage();
  }

  onFilterChange(): void {
    this.filtersSubject.next({
      category: this.selectedCategory,
      complexity: this.selectedComplexity
    });
    this.resetToFirstPage();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    
    this.pageSubject.next({
      page: event.pageIndex,
      size: event.pageSize
    });
  }

  onTemplateToggle(template: ProcessTemplate, isSelected: boolean): void {
    if (isSelected) {
      if (!this.selectedTemplates.includes(template.id)) {
        this.selectedTemplates.push(template.id);
      }
    } else {
      this.selectedTemplates = this.selectedTemplates.filter(id => id !== template.id);
    }
    
    this.emitSelectionChange();
    
    const action = isSelected ? 'added to' : 'removed from';
    this.snackBar.open(`${template.name} ${action} selection`, 'Close', {
      duration: 2000
    });
  }

  isSelected(templateId: string): boolean {
    return this.selectedTemplates.includes(templateId);
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.onSearchChange();
  }

  clearAllFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedComplexity = '';
    
    this.searchTermSubject.next('');
    this.filtersSubject.next({ category: '', complexity: '' });
    this.resetToFirstPage();
  }

  clearAllSelections(): void {
    this.selectedTemplates = [];
    this.emitSelectionChange();
    
    this.snackBar.open('All templates removed from selection', 'Close', {
      duration: 2000
    });
  }

  previewTemplate(template: ProcessTemplate): void {
    // In a real implementation, this would open a preview modal
    this.snackBar.open(`Preview for ${template.name} would open in a modal`, 'Close', {
      duration: 3000
    });
  }

  proceedWithSelection(): void {
    if (this.selectedTemplates.length === 0) return;
    
    this.snackBar.open('Proceeding with template selection...', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  getSelectedTemplateDetails(): ProcessTemplate[] {
    // This would normally use the service to get full template details
    // For now, we'll return a simplified version
    return this.selectedTemplates.map(id => ({
      id,
      name: `Template ${id.slice(-3)}`,
      category: 'tenant-management',
      complexity: 'moderate' as const,
      description: '',
      stepCount: 5,
      estimatedDuration: '2-3 hours',
      roles: [],
      keyFeatures: [],
      tags: [],
      isPopular: false,
      isRecommended: false,
      createdDate: new Date(),
      lastModified: new Date()
    }));
  }

  private resetToFirstPage(): void {
    this.currentPage = 0;
    this.pageSubject.next({
      page: 0,
      size: this.pageSize
    });
  }

  private emitSelectionChange(): void {
    const selection: ProcessTemplateSelection = {
      selectedTemplateIds: [...this.selectedTemplates],
      totalSelected: this.selectedTemplates.length
    };
    
    this.selectionChange.emit(selection);
  }
}