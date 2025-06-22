import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, BehaviorSubject, combineLatest, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

import { AssetService, ProcessService, TaskService } from '../../core/services';
import { 
  Asset, 
  ProcessSummary, 
  TaskSummary, 
  AssetSearchCriteria,
  ProcessKeyField,
  TaskStatus
} from '../../models';

import {
  HeaderComponent,
  SidebarNavigationComponent,
  ProcessTilesComponent,
  TaskGridComponent,
  ImageUploadComponent,
  ProcessKeyFieldsComponent,
  LoadingSpinnerComponent
} from '../../shared/components';

@Component({
  selector: 'app-asset-view-redesigned',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    HeaderComponent,
    SidebarNavigationComponent,
    ProcessTilesComponent,
    TaskGridComponent,
    ImageUploadComponent,
    ProcessKeyFieldsComponent,
    LoadingSpinnerComponent
  ],
  template: `
    <div class="asset-view-layout">
      <!-- Header -->
      <app-header
        [searchValue]="searchTerm"
        [userName]="currentUser?.firstName + ' ' + currentUser?.lastName"
        [userRole]="currentUser?.role"
        (searchChange)="onSearchChange($event)"
        (searchSubmit)="onSearchSubmit($event)"
        (logout)="onLogout()"
      ></app-header>

      <!-- Main Layout with Sidebar -->
      <mat-sidenav-container class="main-container">
        <!-- Sidebar Navigation -->
        <mat-sidenav 
          #sidenav
          [opened]="sidenavOpened"
          [mode]="(isHandset$ | async) ? 'over' : 'side'"
          class="sidebar"
          fixedInViewport="true"
          [fixedTopGap]="64"
        >
          <app-sidebar-navigation
            [processes]="processes"
            [selectedProcessId]="selectedProcess?.id || null"
            [currentAssetAddress]="currentAsset?.propertyAddress || ''"
            [currentAssetType]="currentAsset?.propertyType || ''"
            (processSelect)="onProcessSelect($event)"
            (createTask)="onCreateTask()"
            (generateReport)="onGenerateReport()"
          ></app-sidebar-navigation>
        </mat-sidenav>

        <!-- Main Content -->
        <mat-sidenav-content class="main-content">
          <div class="content-wrapper" *ngIf="currentAsset">
            <!-- Main Content Area -->
            <div class="primary-content">
              <!-- Image Upload Section -->
              <div class="image-section">
                <app-image-upload
                  [currentImageUrl]="currentAsset.imageUrl || null"
                  [imageAlt]="currentAsset.propertyAddress"
                  [isUploading]="isImageUploading"
                  [uploadProgress]="uploadProgress"
                  (fileSelected)="onImageUpload($event)"
                  (imageRemove)="onImageRemove()"
                ></app-image-upload>
              </div>

              <!-- Process Tiles Section -->
              <div class="process-tiles-section">
                <app-process-tiles
                  [processes]="processes"
                  [selectedProcessId]="selectedProcess?.id || null"
                  [isLoading]="isProcessesLoading"
                  (processSelect)="onProcessSelect($event)"
                  (viewDetails)="onProcessViewDetails($event)"
                  (quickAction)="onProcessQuickAction($event)"
                  (refresh)="onRefreshProcesses()"
                ></app-process-tiles>
              </div>

              <!-- Task Grid Section -->
              <div class="task-grid-section" *ngIf="selectedProcess">
                <app-task-grid
                  [tasks]="tasks"
                  [isLoading]="isTasksLoading"
                  (taskClick)="onTaskClick($event)"
                  (taskEdit)="onTaskEdit($event)"
                  (taskDelete)="onTaskDelete($event)"
                  (statusChange)="onTaskStatusChange($event)"
                  (createTask)="onCreateTask()"
                ></app-task-grid>
              </div>
            </div>

            <!-- Secondary Content (Key Fields Panel) -->
            <div class="secondary-content" *ngIf="selectedProcess">
              <app-process-key-fields
                [keyFields]="processKeyFields"
                [isLoading]="isKeyFieldsLoading"
                (fieldChange)="onKeyFieldChange($event)"
                (save)="onKeyFieldsSave($event)"
                (refresh)="onKeyFieldsRefresh()"
              ></app-process-key-fields>
            </div>
          </div>

          <!-- No Asset Selected State -->
          <div class="no-asset-state" *ngIf="!currentAsset && !isSearching">
            <div class="no-asset-content">
              <mat-icon class="no-asset-icon">search</mat-icon>
              <h2>Find Your Asset</h2>
              <p>Enter an asset number in the search bar above to view property details, processes, and tasks.</p>
              <div class="example-searches">
                <h4>Try these examples:</h4>
                <button 
                  *ngFor="let example of exampleAssets" 
                  class="example-btn"
                  (click)="onExampleSearch(example)"
                >
                  {{ example }}
                </button>
              </div>
            </div>
          </div>

          <!-- Loading State -->
          <app-loading-spinner 
            *ngIf="isSearching" 
            [message]="'Searching for asset...'"
            [overlay]="false"
          ></app-loading-spinner>

          <!-- Error State -->
          <div class="error-state" *ngIf="searchError">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <h3>Asset Not Found</h3>
            <p>{{ searchError }}</p>
            <button class="retry-btn" (click)="onRetrySearch()">Try Again</button>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .asset-view-layout {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #fafafa;
    }

    .main-container {
      flex: 1;
      
      .sidebar {
        width: 280px;
        border-right: 1px solid #e0e0e0;
        box-shadow: 2px 0 4px rgba(0,0,0,0.1);
      }
      
      .main-content {
        background-color: #fafafa;
      }
    }

    .content-wrapper {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 24px;
      padding: 24px;
      min-height: calc(100vh - 64px);
      max-width: 1600px;
      margin: 0 auto;
    }

    .primary-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
      min-width: 0; // Prevent flex overflow
      
      .image-section {
        align-self: flex-start;
      }
      
      .process-tiles-section {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      
      .task-grid-section {
        background: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow: hidden;
      }
    }

    .secondary-content {
      position: sticky;
      top: 88px; // Header height + padding
      height: fit-content;
      max-height: calc(100vh - 112px);
      overflow-y: auto;
    }

    .no-asset-state {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 64px);
      padding: 40px;
      
      .no-asset-content {
        text-align: center;
        max-width: 500px;
        
        .no-asset-icon {
          font-size: 96px;
          width: 96px;
          height: 96px;
          color: #ccc;
          margin-bottom: 24px;
        }
        
        h2 {
          margin: 0 0 16px 0;
          color: #333;
          font-weight: 400;
        }
        
        p {
          color: #666;
          font-size: 16px;
          line-height: 1.5;
          margin-bottom: 32px;
        }
        
        .example-searches {
          h4 {
            margin: 0 0 16px 0;
            color: #666;
            font-weight: 500;
            font-size: 14px;
          }
          
          .example-btn {
            display: inline-block;
            margin: 4px 8px;
            padding: 8px 16px;
            background: #e3f2fd;
            color: #1976d2;
            border: 1px solid #bbdefb;
            border-radius: 20px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s ease;
            
            &:hover {
              background: #bbdefb;
            }
          }
        }
      }
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 64px);
      text-align: center;
      color: #666;
      
      .error-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #f44336;
        margin-bottom: 16px;
      }
      
      h3 {
        margin: 0 0 8px 0;
        color: #333;
      }
      
      p {
        margin: 0 0 24px 0;
        font-size: 14px;
      }
      
      .retry-btn {
        padding: 8px 24px;
        background: #1976d2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        
        &:hover {
          background: #1565c0;
        }
      }
    }

    // Responsive Design
    @media (max-width: 1200px) {
      .content-wrapper {
        grid-template-columns: 1fr;
        gap: 16px;
        padding: 16px;
      }
      
      .secondary-content {
        position: static;
        max-height: none;
      }
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 240px;
      }
      
      .content-wrapper {
        padding: 12px;
        gap: 12px;
      }
      
      .primary-content {
        gap: 16px;
      }
    }

    @media (max-width: 480px) {
      .content-wrapper {
        padding: 8px;
      }
      
      .no-asset-state {
        padding: 20px;
        
        .no-asset-content {
          .no-asset-icon {
            font-size: 64px;
            width: 64px;
            height: 64px;
          }
          
          h2 {
            font-size: 20px;
          }
          
          p {
            font-size: 14px;
          }
        }
      }
    }
  `]
})
export class AssetViewRedesignedComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private breakpointObserver = inject(BreakpointObserver);
  private assetService = inject(AssetService);
  private processService = inject(ProcessService);
  private taskService = inject(TaskService);

  // State observables
  private searchTerm$ = new BehaviorSubject<string>('');
  private selectedProcess$ = new BehaviorSubject<ProcessSummary | null>(null);

  // Layout state
  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset);
  sidenavOpened = true;

  // Data state
  currentAsset: Asset | null = null;
  currentUser: any = { firstName: 'Demo', lastName: 'User', role: 'Property Manager' };
  processes: ProcessSummary[] = [];
  selectedProcess: ProcessSummary | null = null;
  tasks: TaskSummary[] = [];
  processKeyFields: ProcessKeyField[] = [];

  // UI state
  searchTerm = '';
  isSearching = false;
  isProcessesLoading = false;
  isTasksLoading = false;
  isKeyFieldsLoading = false;
  isImageUploading = false;
  uploadProgress = 0;
  searchError: string | null = null;

  // Example data
  exampleAssets = ['AST-2024-0001', 'AST-2024-0002', 'AST-2024-0003', 'AST-2024-0004'];

  ngOnInit() {
    this.setupSearchSubscription();
    this.setupProcessSubscription();
    this.setupResponsiveLayout();
    this.loadInitialData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearchSubscription() {
    this.searchTerm$.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(term => this.performAssetSearch(term)),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (asset) => {
        this.currentAsset = asset;
        this.searchError = null;
        this.isSearching = false;
        
        if (asset) {
          this.loadProcesses(asset.id);
        } else {
          this.clearProcessData();
        }
      },
      error: (error) => {
        this.searchError = 'Asset not found. Please check the asset number and try again.';
        this.isSearching = false;
        this.clearProcessData();
      }
    });
  }

  private setupProcessSubscription() {
    this.selectedProcess$.pipe(
      switchMap(process => {
        if (process && this.currentAsset) {
          this.isTasksLoading = true;
          this.isKeyFieldsLoading = true;
          
          return combineLatest([
            this.taskService.getTasksByProcessId(process.id),
            this.processService.getProcessById(process.id)
          ]);
        }
        return of([[], null]);
      }),
      takeUntil(this.destroy$)
    ).subscribe((result) => {
      if (result && Array.isArray(result) && result.length === 2) {
        const [tasks, processDetails] = result;
        this.tasks = (tasks as TaskSummary[]) || [];
        this.processKeyFields = (processDetails as any)?.keyFields || [];
      }
      
      this.isTasksLoading = false;
      this.isKeyFieldsLoading = false;
    });
  }

  private setupResponsiveLayout() {
    this.isHandset$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isHandset => {
      this.sidenavOpened = !isHandset.matches;
    });
  }

  private loadInitialData() {
    // Auto-load demo asset
    this.searchTerm = 'AST-2024-0001';
    this.searchTerm$.next(this.searchTerm);
  }

  private async performAssetSearch(term: string): Promise<Asset | null> {
    if (!term.trim()) {
      this.isSearching = false;
      return null;
    }
    
    this.isSearching = true;
    
    try {
      const asset = await this.assetService.getAssetByNumber(term).toPromise();
      return asset || null;
    } catch (error) {
      throw error;
    }
  }

  private async loadProcesses(assetId: string) {
    this.isProcessesLoading = true;
    
    try {
      this.processes = await this.processService.getProcessesByAssetId(assetId).toPromise() || [];
      
      // Auto-select first process
      if (this.processes.length > 0) {
        this.onProcessSelect(this.processes[0]);
      }
    } catch (error) {
      console.error('Error loading processes:', error);
    } finally {
      this.isProcessesLoading = false;
    }
  }

  private clearProcessData() {
    this.processes = [];
    this.selectedProcess = null;
    this.tasks = [];
    this.processKeyFields = [];
    this.selectedProcess$.next(null);
  }

  // Event Handlers
  onSearchChange(term: string) {
    this.searchTerm = term;
  }

  onSearchSubmit(term: string) {
    this.searchTerm$.next(term);
  }

  onExampleSearch(assetNumber: string) {
    this.searchTerm = assetNumber;
    this.searchTerm$.next(assetNumber);
  }

  onRetrySearch() {
    this.searchError = null;
    if (this.searchTerm) {
      this.searchTerm$.next(this.searchTerm);
    }
  }

  onProcessSelect(process: ProcessSummary) {
    this.selectedProcess = process;
    this.selectedProcess$.next(process);
  }

  onProcessViewDetails(process: ProcessSummary) {
    // Implementation for viewing process details
    console.log('View process details:', process);
  }

  onProcessQuickAction(process: ProcessSummary) {
    // Implementation for process quick actions
    console.log('Process quick action:', process);
  }

  onRefreshProcesses() {
    if (this.currentAsset) {
      this.loadProcesses(this.currentAsset.id);
    }
  }

  onTaskClick(task: TaskSummary) {
    // Implementation for task click
    console.log('Task clicked:', task);
  }

  onTaskEdit(task: TaskSummary) {
    // Implementation for task editing
    console.log('Edit task:', task);
  }

  onTaskDelete(task: TaskSummary) {
    // Implementation for task deletion
    console.log('Delete task:', task);
  }

  onTaskStatusChange(event: {task: TaskSummary, status: TaskStatus}) {
    // Implementation for task status change
    console.log('Task status change:', event);
  }

  onCreateTask() {
    // Implementation for creating new task
    console.log('Create new task');
  }

  onGenerateReport() {
    // Implementation for report generation
    console.log('Generate report');
  }

  onImageUpload(file: File) {
    if (!this.currentAsset) return;
    
    this.isImageUploading = true;
    this.uploadProgress = 0;
    
    // Simulate upload progress
    const interval = setInterval(() => {
      this.uploadProgress += 10;
      
      if (this.uploadProgress >= 100) {
        clearInterval(interval);
        this.isImageUploading = false;
        this.uploadProgress = 0;
        
        // Update asset image URL
        if (this.currentAsset) {
          this.currentAsset.imageUrl = `/assets/images/uploaded-${Date.now()}.jpg`;
        }
      }
    }, 200);
  }

  onImageRemove() {
    if (this.currentAsset) {
      this.currentAsset.imageUrl = undefined;
    }
  }

  onKeyFieldChange(event: {field: ProcessKeyField, value: any}) {
    // Implementation for key field changes
    console.log('Key field change:', event);
  }

  onKeyFieldsSave(fields: ProcessKeyField[]) {
    if (!this.selectedProcess) return;
    
    this.isKeyFieldsLoading = true;
    
    // Simulate save operation
    setTimeout(() => {
      this.processKeyFields = [...fields];
      this.isKeyFieldsLoading = false;
      console.log('Key fields saved:', fields);
    }, 1000);
  }

  onKeyFieldsRefresh() {
    if (this.selectedProcess) {
      this.selectedProcess$.next(this.selectedProcess);
    }
  }

  onLogout() {
    // Implementation for logout
    console.log('User logout');
  }
}