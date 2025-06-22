import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, BehaviorSubject, combineLatest, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';

import { AssetService, ProcessService, TaskService } from '../../core/services';
import { 
  Asset, 
  ProcessSummary, 
  TaskSummary, 
  AssetSearchCriteria,
  TaskFilter,
  TaskSort,
  ProcessKeyField
} from '../../models';

@Component({
  selector: 'app-asset-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatSidenavModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatGridListModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './asset-view.component.html',
  styleUrls: ['./asset-view.component.scss']
})
export class AssetViewComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private breakpointObserver = inject(BreakpointObserver);
  private assetService = inject(AssetService);
  private processService = inject(ProcessService);
  private taskService = inject(TaskService);

  // Reactive state
  private searchTerm$ = new BehaviorSubject<string>('');
  private selectedAsset$ = new BehaviorSubject<Asset | null>(null);
  private selectedProcess$ = new BehaviorSubject<ProcessSummary | null>(null);

  // Observables
  isHandset$ = this.breakpointObserver.observe(Breakpoints.Handset);
  
  // Component state
  currentAsset: Asset | null = null;
  processes: ProcessSummary[] = [];
  selectedProcess: ProcessSummary | null = null;
  tasks: TaskSummary[] = [];
  processKeyFields: ProcessKeyField[] = [];
  
  // UI state
  isLoading = false;
  searchTerm = '';
  sidenavOpened = true;
  
  // File upload
  selectedFile: File | null = null;
  uploadProgress = 0;

  // Task filtering and sorting
  taskFilter: TaskFilter = {};
  taskSort: TaskSort = { field: 'dueDate', direction: 'asc' };

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
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.searchAsset(term)),
      takeUntil(this.destroy$)
    ).subscribe(asset => {
      this.selectedAsset$.next(asset);
      this.currentAsset = asset;
      if (asset) {
        this.loadProcesses(asset.id);
      }
    });
  }

  private setupProcessSubscription() {
    this.selectedProcess$.pipe(
      switchMap(process => {
        if (process && this.currentAsset) {
          return combineLatest([
            this.taskService.getTasksByProcessId(process.id, this.taskFilter, this.taskSort),
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
    });
  }

  private setupResponsiveLayout() {
    this.isHandset$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(isHandset => {
      this.sidenavOpened = !isHandset.matches;
    });
  }

  private async loadInitialData() {
    this.searchAsset('AST-2024-0001').then(asset => {
      if (asset) {
        this.searchTerm = asset.assetNumber;
        this.searchTerm$.next(asset.assetNumber);
      }
    });
  }

  private async searchAsset(term: string): Promise<Asset | null> {
    if (!term.trim()) return null;
    
    this.isLoading = true;
    try {
      const asset = await this.assetService.getAssetByNumber(term).toPromise();
      return asset || null;
    } catch (error) {
      console.error('Error searching asset:', error);
      return null;
    } finally {
      this.isLoading = false;
    }
  }

  private async loadProcesses(assetId: string) {
    try {
      this.processes = await this.processService.getProcessesByAssetId(assetId).toPromise() || [];
      if (this.processes.length > 0) {
        this.onProcessSelected(this.processes[0]);
      }
    } catch (error) {
      console.error('Error loading processes:', error);
    }
  }

  onSearchTermChange(term: string) {
    this.searchTerm = term;
    this.searchTerm$.next(term);
  }

  onProcessSelected(process: ProcessSummary) {
    this.selectedProcess = process;
    this.selectedProcess$.next(process);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      this.selectedFile = target.files[0];
    }
  }

  async uploadImage() {
    if (!this.selectedFile || !this.currentAsset) return;

    this.uploadProgress = 0;
    try {
      const imageUrl = await this.assetService.uploadAssetImage(
        this.currentAsset.id, 
        this.selectedFile
      ).toPromise();
      
      if (imageUrl && this.currentAsset) {
        this.currentAsset.imageUrl = imageUrl;
      }
      this.selectedFile = null;
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  }

  onTaskFilterChange(filter: TaskFilter) {
    this.taskFilter = filter;
    if (this.selectedProcess) {
      this.selectedProcess$.next(this.selectedProcess);
    }
  }

  onTaskSortChange(sort: TaskSort) {
    this.taskSort = sort;
    if (this.selectedProcess) {
      this.selectedProcess$.next(this.selectedProcess);
    }
  }

  async updateProcessKeyField(field: ProcessKeyField, value: any) {
    if (!this.selectedProcess) return;

    const updatedField = { ...field, value };
    const updatedFields = this.processKeyFields.map(f => 
      f.id === field.id ? updatedField : f
    );

    try {
      await this.processService.updateProcessKeyFields(
        this.selectedProcess.id,
        updatedFields
      ).toPromise();
      
      this.processKeyFields = updatedFields;
    } catch (error) {
      console.error('Error updating process key field:', error);
    }
  }

  getProcessStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      'completed': '#4CAF50',
      'in_progress': '#FF9800',
      'not_started': '#9E9E9E',
      'on_hold': '#F44336',
      'cancelled': '#424242'
    };
    return statusColors[status] || '#9E9E9E';
  }

  getTaskPriorityColor(priority: string): string {
    const priorityColors: Record<string, string> = {
      'urgent': '#F44336',
      'high': '#FF9800',
      'medium': '#2196F3',
      'low': '#4CAF50'
    };
    return priorityColors[priority] || '#9E9E9E';
  }

  isTaskOverdue(dueDate?: Date): boolean {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
  }

  getDateValue(value: string | number | boolean | Date): string {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return '';
  }

  onFieldBlur(field: ProcessKeyField, event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateProcessKeyField(field, target.value);
  }

  onFieldChange(field: ProcessKeyField, event: Event) {
    const target = event.target as HTMLInputElement;
    this.updateProcessKeyField(field, target.value);
  }
}