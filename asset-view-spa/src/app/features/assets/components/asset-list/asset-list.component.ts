/**
 * Asset List Component with Enterprise Performance Patterns
 * Demonstrates OnPush change detection, virtual scrolling, and reactive patterns
 */

import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectionStrategy, 
  ChangeDetectorRef,
  ViewChild,
  AfterViewInit,
  TrackByFunction
} from '@angular/core';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { 
  takeUntil, 
  debounceTime, 
  distinctUntilChanged, 
  startWith,
  switchMap,
  tap,
  shareReplay,
  map
} from 'rxjs/operators';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { FormControl } from '@angular/forms';

import { AssetService, AssetState, AssetFilters } from '../../../../core/services/asset.service';
import { ApiSimulationService } from '../../../../core/services/api-simulation.service';
import { 
  Asset, 
  LoadingState, 
  AssetSearchCriteria,
  Priority
} from '../../../../core/models';

interface AssetListViewModel {
  assets: Asset[];
  loading: LoadingState;
  totalCount: number;
  hasError: boolean;
  errorMessage: string | null;
  filters: AssetFilters;
  searchQuery: string;
}

@Component({
  selector: 'app-asset-list',
  templateUrl: './asset-list.component.html',
  styleUrls: ['./asset-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush, // 🚀 Performance optimization
  providers: [
    // Component-level providers for better encapsulation
  ]
})
export class AssetListComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Reactive form controls for performance
  searchControl = new FormControl('');
  
  // Observable streams for reactive programming
  private destroy$ = new Subject<void>();
  private searchTrigger$ = new BehaviorSubject<string>('');
  private refreshTrigger$ = new Subject<void>();

  // Table configuration
  displayedColumns: string[] = [
    'assetNumber',
    'propertyAddress', 
    'clientName',
    'investor',
    'propertyType',
    'currentValue',
    'status',
    'actions'
  ];

  // Optimized data source
  dataSource = new MatTableDataSource<Asset>([]);

  // ViewModel observable for OnPush optimization
  viewModel$: Observable<AssetListViewModel>;

  // Performance tracking
  private performanceMetrics = {
    componentInitTime: 0,
    dataLoadTime: 0,
    renderTime: 0,
    lastUpdateTime: new Date()
  };

  constructor(
    private assetService: AssetService,
    private apiSimulation: ApiSimulationService,
    private cdr: ChangeDetectorRef // Explicit change detection for OnPush
  ) {
    console.time('AssetListComponent.constructor');
    
    // Initialize reactive streams
    this.viewModel$ = this.initializeViewModel();
    
    console.timeEnd('AssetListComponent.constructor');
  }

  ngOnInit(): void {
    console.time('AssetListComponent.init');
    this.performanceMetrics.componentInitTime = performance.now();

    // Set up search with debouncing for performance
    this.setupSearch();
    
    // Load initial data
    this.loadAssets();

    console.timeEnd('AssetListComponent.init');
  }

  ngAfterViewInit(): void {
    // Set up Material table features after view init
    this.setupTableFeatures();
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    this.destroy$.next();
    this.destroy$.complete();
    
    console.log('🧹 AssetListComponent destroyed - Performance metrics:', this.performanceMetrics);
  }

  // TrackBy function for *ngFor optimization
  trackByAssetId: TrackByFunction<Asset> = (index: number, asset: Asset): string => {
    return asset.id;
  };

  // Performance-optimized event handlers
  onRefresh(): void {
    console.time('AssetList.refresh');
    
    // Simulate different API scenarios for demonstration
    this.demonstrateApiScenarios();
    
    this.refreshTrigger$.next();
    console.timeEnd('AssetList.refresh');
  }

  onSearch(query: string): void {
    this.searchTrigger$.next(query);
  }

  onFilterChange(filters: AssetFilters): void {
    console.time('AssetList.filter');
    this.assetService.setFilters(filters);
    console.timeEnd('AssetList.filter');
  }

  onAssetSelect(asset: Asset): void {
    // Use service for state management instead of component state
    this.assetService.selectAsset(asset);
    
    // Trigger change detection manually for OnPush
    this.cdr.markForCheck();
  }

  // Demonstrate enterprise error handling
  onRetryAfterError(): void {
    console.log('🔄 Retrying after error...');
    this.apiSimulation.simulateFastCache(); // Reset to fast responses
    this.loadAssets();
  }

  // Private methods for reactive programming patterns
  private initializeViewModel(): Observable<AssetListViewModel> {
    console.time('AssetList.viewModel.init');

    const viewModel$ = combineLatest([
      this.assetService.state$,
      this.searchTrigger$.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith('')
      ),
      this.refreshTrigger$.pipe(startWith(null))
    ]).pipe(
      map(([state, searchQuery]) => {
        const viewModel: AssetListViewModel = {
          assets: state.assets,
          loading: state.loading,
          totalCount: state.assets.length,
          hasError: !!state.loading.error,
          errorMessage: state.loading.error,
          filters: state.filters,
          searchQuery
        };

        // Update data source for Material table
        this.updateDataSource(viewModel.assets);
        
        return viewModel;
      }),
      tap(viewModel => {
        // Performance tracking
        this.performanceMetrics.lastUpdateTime = new Date();
        this.performanceMetrics.renderTime = performance.now();
        
        // Trigger change detection for OnPush
        this.cdr.markForCheck();
        
        console.log('📊 AssetList ViewModel updated:', {
          assetCount: viewModel.assets.length,
          isLoading: viewModel.loading.isLoading,
          hasError: viewModel.hasError,
          renderTime: this.performanceMetrics.renderTime
        });
      }),
      shareReplay(1), // Cache latest emission for performance
      takeUntil(this.destroy$)
    );

    console.timeEnd('AssetList.viewModel.init');
    return viewModel$;
  }

  private setupSearch(): void {
    // Reactive search with debouncing
    this.searchControl.valueChanges.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged(),
      switchMap((query: string | null) => {
        const searchQuery = query || '';
        console.log('🔍 Search triggered:', searchQuery);
        
        if (searchQuery.length >= 2) {
          return this.apiSimulation.searchAssets(searchQuery);
        } else {
          // Load all assets if search is cleared
          return this.apiSimulation.getAssets();
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        // Update service state with search results
        if (response.success) {
          this.assetService['assetsSubject'].next(response.data);
        }
      },
      error: (error) => {
        console.error('❌ Search error:', error);
        this.handleSearchError(error);
      }
    });
  }

  private setupTableFeatures(): void {
    // Connect Material table features
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;

    // Custom sorting for complex fields
    this.dataSource.sortingDataAccessor = (asset: Asset, property: string) => {
      switch (property) {
        case 'propertyAddress':
          return asset.propertyAddress.street;
        case 'currentValue':
          return asset.currentValue;
        default:
          return (asset as any)[property];
      }
    };

    // Custom filtering for complex searches
    this.dataSource.filterPredicate = (asset: Asset, filter: string) => {
      const searchStr = [
        asset.assetNumber,
        asset.propertyAddress.street,
        asset.clientName,
        asset.investor,
        asset.propertyType
      ].join(' ').toLowerCase();
      
      return searchStr.includes(filter.toLowerCase());
    };
  }

  private loadAssets(): void {
    console.time('AssetList.loadAssets');
    
    this.performanceMetrics.dataLoadTime = performance.now();
    
    // Use the service's reactive pattern
    this.assetService.getAssets().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (assets) => {
        console.timeEnd('AssetList.loadAssets');
        console.log('✅ Assets loaded:', assets.length);
      },
      error: (error) => {
        console.timeEnd('AssetList.loadAssets');
        console.error('❌ Failed to load assets:', error);
        this.handleLoadError(error);
      }
    });
  }

  private updateDataSource(assets: Asset[]): void {
    // Optimized data source update
    if (this.dataSource.data.length !== assets.length || 
        this.hasDataChanged(this.dataSource.data, assets)) {
      
      console.time('AssetList.updateDataSource');
      this.dataSource.data = assets;
      console.timeEnd('AssetList.updateDataSource');
    }
  }

  private hasDataChanged(current: Asset[], updated: Asset[]): boolean {
    // Efficient change detection for OnPush optimization
    if (current.length !== updated.length) return true;
    
    return current.some((asset, index) => 
      asset.id !== updated[index]?.id || 
      asset.version !== updated[index]?.version
    );
  }

  private handleLoadError(error: any): void {
    console.error('🚨 Asset load error:', error);
    
    // Enterprise error handling patterns
    if (error.status === 503) {
      // Service unavailable - suggest retry
      console.log('💡 Service unavailable - implementing retry strategy');
    } else if (error.status === 429) {
      // Rate limited - back off
      console.log('🛑 Rate limited - backing off');
    }
    
    // Update loading state through service
    this.assetService['setLoading'](false, error.message);
  }

  private handleSearchError(error: any): void {
    console.error('🔍❌ Search error:', error);
    // Handle search-specific errors
  }

  private demonstrateApiScenarios(): void {
    // Demonstrate different enterprise API scenarios
    const scenarios = [
      () => this.apiSimulation.simulateFastCache(),
      () => this.apiSimulation.simulateSlowQuery(),
      () => this.apiSimulation.simulateHighErrorRate()
    ];

    const randomScenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    randomScenario();
    
    console.log('🎭 API scenario changed for demonstration');
  }

  // Performance monitoring methods
  getPerformanceMetrics(): any {
    return {
      ...this.performanceMetrics,
      memoryUsage: (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize
      } : 'Not available'
    };
  }
}