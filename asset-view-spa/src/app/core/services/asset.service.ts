/**
 * Asset Service with Enterprise State Management
 * Demonstrates reactive programming patterns with RxJS and caching
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, merge, EMPTY } from 'rxjs';
import { 
  map, 
  shareReplay, 
  catchError, 
  switchMap, 
  debounceTime, 
  distinctUntilChanged,
  startWith,
  scan,
  filter,
  tap
} from 'rxjs/operators';

import { BaseApiService } from './base-api.service';
import { 
  Asset, 
  AssetSearchCriteria, 
  AssetSummary, 
  ApiResponse,
  LoadingState,
  SearchCriteria,
  PaginationMeta
} from '../models';

export interface AssetState {
  assets: Asset[];
  selectedAsset: Asset | null;
  searchCriteria: AssetSearchCriteria;
  pagination: PaginationMeta;
  loading: LoadingState;
  summary: AssetSummary | null;
  filters: AssetFilters;
  sortOptions: AssetSortOptions;
}

export interface AssetFilters {
  propertyTypes: string[];
  statuses: string[];
  clients: string[];
  investors: string[];
  valueRange: { min: number; max: number } | null;
  dateRange: { start: Date; end: Date } | null;
}

export interface AssetSortOptions {
  field: keyof Asset;
  direction: 'asc' | 'desc';
  secondarySort?: {
    field: keyof Asset;
    direction: 'asc' | 'desc';
  };
}

@Injectable({
  providedIn: 'root'
})
export class AssetService extends BaseApiService {
  // State subjects
  private assetsSubject = new BehaviorSubject<Asset[]>([]);
  private selectedAssetSubject = new BehaviorSubject<Asset | null>(null);
  private searchCriteriaSubject = new BehaviorSubject<AssetSearchCriteria>({});
  private paginationSubject = new BehaviorSubject<PaginationMeta>({ 
    page: 1, 
    limit: 50, 
    total: 0, 
    totalPages: 0 
  });
  private loadingSubject = new BehaviorSubject<LoadingState>({ 
    isLoading: false, 
    error: null, 
    lastUpdated: null 
  });
  private summarySubject = new BehaviorSubject<AssetSummary | null>(null);
  private filtersSubject = new BehaviorSubject<AssetFilters>({
    propertyTypes: [],
    statuses: [],
    clients: [],
    investors: [],
    valueRange: null,
    dateRange: null
  });
  private sortSubject = new BehaviorSubject<AssetSortOptions>({
    field: 'assetNumber',
    direction: 'asc'
  });

  // Public observables
  public readonly assets$ = this.assetsSubject.asObservable();
  public readonly selectedAsset$ = this.selectedAssetSubject.asObservable();
  public readonly searchCriteria$ = this.searchCriteriaSubject.asObservable();
  public readonly pagination$ = this.paginationSubject.asObservable();
  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly summary$ = this.summarySubject.asObservable();
  public readonly filters$ = this.filtersSubject.asObservable();
  public readonly sort$ = this.sortSubject.asObservable();

  // Computed observables
  public readonly state$: Observable<AssetState> = combineLatest([
    this.assets$,
    this.selectedAsset$,
    this.searchCriteria$,
    this.pagination$,
    this.loading$,
    this.summary$,
    this.filters$,
    this.sort$
  ]).pipe(
    map(([assets, selectedAsset, searchCriteria, pagination, loading, summary, filters, sortOptions]) => ({
      assets,
      selectedAsset,
      searchCriteria,
      pagination,
      loading,
      summary,
      filters,
      sortOptions
    })),
    shareReplay(1)
  );

  // Reactive search that triggers on criteria changes
  public readonly searchResults$: Observable<Asset[]> = combineLatest([
    this.searchCriteriaSubject.pipe(debounceTime(300), distinctUntilChanged()),
    this.filtersSubject.pipe(distinctUntilChanged()),
    this.sortSubject.pipe(distinctUntilChanged()),
    this.paginationSubject.pipe(distinctUntilChanged())
  ]).pipe(
    switchMap(([criteria, filters, sort, pagination]) => 
      this.performSearch(criteria, filters, sort, pagination)
    ),
    shareReplay(1)
  );

  // Filtered and sorted assets for the UI
  public readonly displayAssets$: Observable<Asset[]> = combineLatest([
    this.assets$,
    this.filters$,
    this.sort$
  ]).pipe(
    map(([assets, filters, sort]) => 
      this.applyFiltersAndSort(assets, filters, sort)
    ),
    shareReplay(1)
  );

  // Asset statistics
  public readonly assetStats$ = this.assets$.pipe(
    map(assets => this.calculateAssetStatistics(assets)),
    shareReplay(1)
  );

  constructor() {
    super();
    this.initializeReactiveStreams();
  }

  // Asset CRUD operations
  getAssets(criteria?: AssetSearchCriteria): Observable<Asset[]> {
    this.setLoading(true);
    
    const searchParams = criteria ? this.buildSearchParams(criteria) : undefined;
    
    return this.get<Asset[]>('/assets', searchParams, { useCache: true }).pipe(
      map(response => response.data),
      tap(assets => {
        this.assetsSubject.next(assets);
        this.setLoading(false);
        this.updateSummary(assets);
      }),
      catchError(error => {
        this.setLoading(false, error.message);
        return EMPTY;
      })
    );
  }

  getAssetById(id: string): Observable<Asset> {
    this.setLoading(true);
    
    return this.get<Asset>(`/assets/${id}`, undefined, { useCache: true }).pipe(
      map(response => response.data),
      tap(asset => {
        this.selectedAssetSubject.next(asset);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false, error.message);
        throw error;
      })
    );
  }

  createAsset(asset: Partial<Asset>): Observable<Asset> {
    this.setLoading(true);
    
    return this.post<Asset>('/assets', asset, { invalidateCache: true }).pipe(
      map(response => response.data),
      tap(newAsset => {
        const currentAssets = this.assetsSubject.value;
        this.assetsSubject.next([...currentAssets, newAsset]);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false, error.message);
        throw error;
      })
    );
  }

  updateAsset(id: string, updates: Partial<Asset>): Observable<Asset> {
    this.setLoading(true);
    
    return this.put<Asset>(`/assets/${id}`, updates, { invalidateCache: true }).pipe(
      map(response => response.data),
      tap(updatedAsset => {
        const currentAssets = this.assetsSubject.value;
        const index = currentAssets.findIndex(a => a.id === id);
        if (index !== -1) {
          const newAssets = [...currentAssets];
          newAssets[index] = updatedAsset;
          this.assetsSubject.next(newAssets);
        }
        
        if (this.selectedAssetSubject.value?.id === id) {
          this.selectedAssetSubject.next(updatedAsset);
        }
        
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false, error.message);
        throw error;
      })
    );
  }

  deleteAsset(id: string): Observable<boolean> {
    this.setLoading(true);
    
    return this.delete<boolean>(`/assets/${id}`).pipe(
      map(response => response.data),
      tap(() => {
        const currentAssets = this.assetsSubject.value;
        this.assetsSubject.next(currentAssets.filter(a => a.id !== id));
        
        if (this.selectedAssetSubject.value?.id === id) {
          this.selectedAssetSubject.next(null);
        }
        
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false, error.message);
        throw error;
      })
    );
  }

  // State management methods
  setSearchCriteria(criteria: AssetSearchCriteria): void {
    this.searchCriteriaSubject.next(criteria);
  }

  updateSearchCriteria(updates: Partial<AssetSearchCriteria>): void {
    const current = this.searchCriteriaSubject.value;
    this.searchCriteriaSubject.next({ ...current, ...updates });
  }

  setFilters(filters: AssetFilters): void {
    this.filtersSubject.next(filters);
  }

  updateFilters(updates: Partial<AssetFilters>): void {
    const current = this.filtersSubject.value;
    this.filtersSubject.next({ ...current, ...updates });
  }

  setSortOptions(sort: AssetSortOptions): void {
    this.sortSubject.next(sort);
  }

  setPagination(pagination: Partial<PaginationMeta>): void {
    const current = this.paginationSubject.value;
    this.paginationSubject.next({ ...current, ...pagination });
  }

  selectAsset(asset: Asset | null): void {
    this.selectedAssetSubject.next(asset);
  }

  // Utility methods
  refreshAssets(): Observable<Asset[]> {
    this.clearCache();
    const criteria = this.searchCriteriaSubject.value;
    return this.getAssets(criteria);
  }

  clearSelection(): void {
    this.selectedAssetSubject.next(null);
  }

  resetState(): void {
    this.assetsSubject.next([]);
    this.selectedAssetSubject.next(null);
    this.searchCriteriaSubject.next({});
    this.paginationSubject.next({ page: 1, limit: 50, total: 0, totalPages: 0 });
    this.loadingSubject.next({ isLoading: false, error: null, lastUpdated: null });
    this.summarySubject.next(null);
    this.filtersSubject.next({
      propertyTypes: [],
      statuses: [],
      clients: [],
      investors: [],
      valueRange: null,
      dateRange: null
    });
    this.sortSubject.next({ field: 'assetNumber', direction: 'asc' });
  }

  // Private methods
  private initializeReactiveStreams(): void {
    // Auto-update assets when search criteria change
    this.searchResults$.subscribe(assets => {
      // This subscription ensures the search is performed
      // Results are handled in the tap operator of performSearch
    });
  }

  private performSearch(
    criteria: AssetSearchCriteria, 
    filters: AssetFilters, 
    sort: AssetSortOptions, 
    pagination: PaginationMeta
  ): Observable<Asset[]> {
    const searchCriteria: SearchCriteria = {
      ...criteria,
      filters: this.buildFilterCriteria(filters),
      sort: [{ field: sort.field, direction: sort.direction }],
      pagination
    };

    return this.getAssets(searchCriteria);
  }

  private buildFilterCriteria(filters: AssetFilters): any[] {
    const filterCriteria: any[] = [];

    if (filters.propertyTypes.length > 0) {
      filterCriteria.push({
        field: 'propertyType',
        operator: 'in',
        value: filters.propertyTypes
      });
    }

    if (filters.statuses.length > 0) {
      filterCriteria.push({
        field: 'status',
        operator: 'in',
        value: filters.statuses
      });
    }

    if (filters.clients.length > 0) {
      filterCriteria.push({
        field: 'clientName',
        operator: 'in',
        value: filters.clients
      });
    }

    if (filters.investors.length > 0) {
      filterCriteria.push({
        field: 'investor',
        operator: 'in',
        value: filters.investors
      });
    }

    if (filters.valueRange) {
      filterCriteria.push({
        field: 'currentValue',
        operator: 'between',
        value: [filters.valueRange.min, filters.valueRange.max]
      });
    }

    if (filters.dateRange) {
      filterCriteria.push({
        field: 'createdAt',
        operator: 'between',
        value: [filters.dateRange.start, filters.dateRange.end]
      });
    }

    return filterCriteria;
  }

  private applyFiltersAndSort(assets: Asset[], filters: AssetFilters, sort: AssetSortOptions): Asset[] {
    let filtered = [...assets];

    // Apply filters
    if (filters.propertyTypes.length > 0) {
      filtered = filtered.filter(asset => filters.propertyTypes.includes(asset.propertyType));
    }

    if (filters.statuses.length > 0) {
      filtered = filtered.filter(asset => filters.statuses.includes(asset.status));
    }

    if (filters.clients.length > 0) {
      filtered = filtered.filter(asset => filters.clients.includes(asset.clientName));
    }

    if (filters.investors.length > 0) {
      filtered = filtered.filter(asset => filters.investors.includes(asset.investor));
    }

    if (filters.valueRange) {
      filtered = filtered.filter(asset => 
        asset.currentValue >= filters.valueRange!.min && 
        asset.currentValue <= filters.valueRange!.max
      );
    }

    if (filters.dateRange) {
      filtered = filtered.filter(asset => {
        const assetDate = new Date(asset.createdAt);
        return assetDate >= filters.dateRange!.start && assetDate <= filters.dateRange!.end;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sort.field] as any;
      const bValue = b[sort.field] as any;
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return sort.direction === 'desc' ? -comparison : comparison;
    });

    // Apply secondary sort if specified
    if (sort.secondarySort) {
      filtered.sort((a, b) => {
        const primaryComparison = this.compareValues(
          a[sort.field], 
          b[sort.field], 
          sort.direction
        );
        
        if (primaryComparison === 0) {
          return this.compareValues(
            a[sort.secondarySort!.field],
            b[sort.secondarySort!.field],
            sort.secondarySort!.direction
          );
        }
        
        return primaryComparison;
      });
    }

    return filtered;
  }

  private compareValues(a: any, b: any, direction: 'asc' | 'desc'): number {
    let comparison = 0;
    if (a < b) comparison = -1;
    if (a > b) comparison = 1;
    return direction === 'desc' ? -comparison : comparison;
  }

  private calculateAssetStatistics(assets: Asset[]): any {
    return {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + asset.currentValue, 0),
      averageValue: assets.length > 0 ? assets.reduce((sum, asset) => sum + asset.currentValue, 0) / assets.length : 0,
      statusBreakdown: this.groupBy(assets, 'status'),
      propertyTypeBreakdown: this.groupBy(assets, 'propertyType'),
      clientBreakdown: this.groupBy(assets, 'clientName'),
      investorBreakdown: this.groupBy(assets, 'investor')
    };
  }

  private groupBy(array: Asset[], key: keyof Asset): Record<string, number> {
    return array.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = (groups[groupKey] || 0) + 1;
      return groups;
    }, {} as Record<string, number>);
  }

  private updateSummary(assets: Asset[]): void {
    const summary: AssetSummary = {
      totalAssets: assets.length,
      totalValue: assets.reduce((sum, asset) => sum + asset.currentValue, 0),
      averageValue: assets.length > 0 ? assets.reduce((sum, asset) => sum + asset.currentValue, 0) / assets.length : 0,
      assetsByStatus: this.groupBy(assets, 'status'),
      assetsByType: this.groupBy(assets, 'propertyType'),
      recentlyUpdated: assets
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
    };

    this.summarySubject.next(summary);
  }

  private setLoading(isLoading: boolean, error: string | null = null): void {
    const currentState = this.loadingSubject.value;
    this.loadingSubject.next({
      isLoading,
      error,
      lastUpdated: isLoading ? currentState.lastUpdated : new Date()
    });
  }
}