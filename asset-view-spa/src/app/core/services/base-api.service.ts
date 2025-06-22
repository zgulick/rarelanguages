/**
 * Base API service with enterprise-level patterns
 * Demonstrates proper HTTP handling, error management, and caching
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject, timer } from 'rxjs';
import { 
  map, 
  catchError, 
  retry, 
  retryWhen, 
  delay, 
  take, 
  switchMap, 
  shareReplay,
  tap,
  timeout,
  finalize
} from 'rxjs/operators';

import { 
  ApiResponse, 
  SearchCriteria, 
  LoadingState,
  PaginationMeta 
} from '../models';

export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  cacheSize: number;
  cacheTtl: number;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

@Injectable({
  providedIn: 'root'
})
export class BaseApiService {
  private readonly config: ApiConfig = {
    baseUrl: '/api/v1',
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    cacheSize: 100,
    cacheTtl: 300000 // 5 minutes
  };

  private cache = new Map<string, CacheEntry>();
  private loadingStates = new Map<string, BehaviorSubject<LoadingState>>();
  private pendingRequests = new Map<string, Observable<any>>();

  constructor(private http: HttpClient) {
    // Clean up expired cache entries every minute
    timer(0, 60000).subscribe(() => this.cleanupCache());
  }

  /**
   * GET request with caching and error handling
   */
  protected get<T>(
    endpoint: string, 
    params?: HttpParams,
    options: { useCache?: boolean; cacheTtl?: number } = {}
  ): Observable<ApiResponse<T>> {
    const cacheKey = this.generateCacheKey('GET', endpoint, params);
    
    // Check cache first
    if (options.useCache !== false) {
      const cachedData = this.getFromCache<T>(cacheKey);
      if (cachedData) {
        return of(cachedData);
      }
    }

    // Check if request is already pending
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    this.setLoadingState(cacheKey, true);

    const request$ = this.http.get<ApiResponse<T>>(`${this.config.baseUrl}${endpoint}`, {
      params,
      headers: this.getDefaultHeaders()
    }).pipe(
      timeout(this.config.timeout),
      retryWhen(errors => this.handleRetry(errors)),
      tap(response => {
        if (options.useCache !== false && response.success) {
          this.setCache(cacheKey, response, options.cacheTtl);
        }
      }),
      catchError(error => this.handleError(error)),
      finalize(() => {
        this.setLoadingState(cacheKey, false);
        this.pendingRequests.delete(cacheKey);
      }),
      shareReplay(1)
    );

    this.pendingRequests.set(cacheKey, request$);
    return request$;
  }

  /**
   * POST request with proper error handling
   */
  protected post<T>(
    endpoint: string, 
    data: any,
    options: { invalidateCache?: boolean } = {}
  ): Observable<ApiResponse<T>> {
    const cacheKey = this.generateCacheKey('POST', endpoint);
    this.setLoadingState(cacheKey, true);

    return this.http.post<ApiResponse<T>>(`${this.config.baseUrl}${endpoint}`, data, {
      headers: this.getDefaultHeaders()
    }).pipe(
      timeout(this.config.timeout),
      retryWhen(errors => this.handleRetry(errors)),
      tap(() => {
        if (options.invalidateCache) {
          this.invalidateCache(endpoint);
        }
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoadingState(cacheKey, false))
    );
  }

  /**
   * PUT request with cache invalidation
   */
  protected put<T>(
    endpoint: string, 
    data: any,
    options: { invalidateCache?: boolean } = {}
  ): Observable<ApiResponse<T>> {
    const cacheKey = this.generateCacheKey('PUT', endpoint);
    this.setLoadingState(cacheKey, true);

    return this.http.put<ApiResponse<T>>(`${this.config.baseUrl}${endpoint}`, data, {
      headers: this.getDefaultHeaders()
    }).pipe(
      timeout(this.config.timeout),
      retryWhen(errors => this.handleRetry(errors)),
      tap(() => {
        if (options.invalidateCache) {
          this.invalidateCache(endpoint);
        }
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoadingState(cacheKey, false))
    );
  }

  /**
   * DELETE request with cache invalidation
   */
  protected delete<T>(endpoint: string): Observable<ApiResponse<T>> {
    const cacheKey = this.generateCacheKey('DELETE', endpoint);
    this.setLoadingState(cacheKey, true);

    return this.http.delete<ApiResponse<T>>(`${this.config.baseUrl}${endpoint}`, {
      headers: this.getDefaultHeaders()
    }).pipe(
      timeout(this.config.timeout),
      retryWhen(errors => this.handleRetry(errors)),
      tap(() => this.invalidateCache(endpoint)),
      catchError(error => this.handleError(error)),
      finalize(() => this.setLoadingState(cacheKey, false))
    );
  }

  /**
   * Get loading state for a specific request
   */
  getLoadingState(endpoint: string): Observable<LoadingState> {
    const key = this.generateCacheKey('LOADING', endpoint);
    if (!this.loadingStates.has(key)) {
      this.loadingStates.set(key, new BehaviorSubject<LoadingState>({
        isLoading: false,
        error: null,
        lastUpdated: null
      }));
    }
    return this.loadingStates.get(key)!.asObservable();
  }

  /**
   * Build search parameters from criteria
   */
  protected buildSearchParams(criteria: SearchCriteria): HttpParams {
    let params = new HttpParams();

    if (criteria.query) {
      params = params.set('q', criteria.query);
    }

    if (criteria.filters && criteria.filters.length > 0) {
      criteria.filters.forEach((filter, index) => {
        params = params.set(`filter[${index}][field]`, filter.field);
        params = params.set(`filter[${index}][operator]`, filter.operator);
        params = params.set(`filter[${index}][value]`, String(filter.value));
        if (filter.type) {
          params = params.set(`filter[${index}][type]`, filter.type);
        }
      });
    }

    if (criteria.sort && criteria.sort.length > 0) {
      criteria.sort.forEach((sort, index) => {
        params = params.set(`sort[${index}][field]`, sort.field);
        params = params.set(`sort[${index}][direction]`, sort.direction);
      });
    }

    if (criteria.pagination) {
      params = params.set('page', String(criteria.pagination.page));
      params = params.set('limit', String(criteria.pagination.limit));
    }

    return params;
  }

  /**
   * Clear all cache entries
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  private generateCacheKey(method: string, endpoint: string, params?: HttpParams): string {
    const paramStr = params ? params.toString() : '';
    return `${method}:${endpoint}${paramStr ? '?' + paramStr : ''}`;
  }

  private getFromCache<T>(key: string): ApiResponse<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache<T>(key: string, data: ApiResponse<T>, customTtl?: number): void {
    if (this.cache.size >= this.config.cacheSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: customTtl || this.config.cacheTtl,
      key
    });
  }

  private invalidateCache(endpoint: string): void {
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.includes(endpoint));
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));
  }

  private setLoadingState(key: string, isLoading: boolean, error: string | null = null): void {
    if (!this.loadingStates.has(key)) {
      this.loadingStates.set(key, new BehaviorSubject<LoadingState>({
        isLoading: false,
        error: null,
        lastUpdated: null
      }));
    }

    const currentState = this.loadingStates.get(key)!.value;
    this.loadingStates.get(key)!.next({
      isLoading,
      error,
      lastUpdated: isLoading ? currentState.lastUpdated : new Date()
    });
  }

  private getDefaultHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'X-API-Version': '1.0',
      'X-Client': 'asset-view-spa'
    });
  }

  private handleRetry(errors: Observable<any>): Observable<any> {
    return errors.pipe(
      switchMap((error, index) => {
        if (index >= this.config.retryAttempts) {
          return throwError(error);
        }

        // Only retry on network errors or 5xx status codes
        if (error instanceof HttpErrorResponse) {
          if (error.status >= 500 || error.status === 0) {
            return timer(this.config.retryDelay * Math.pow(2, index)); // Exponential backoff
          }
        }

        return throwError(error);
      })
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage: string;
    let errorCode: string;

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
      errorCode = 'CLIENT_ERROR';
    } else {
      // Server-side error
      errorMessage = error.error?.message || `Server Error: ${error.status} ${error.statusText}`;
      errorCode = error.error?.code || `HTTP_${error.status}`;
    }

    console.error('API Error:', {
      message: errorMessage,
      code: errorCode,
      status: error.status,
      url: error.url,
      timestamp: new Date().toISOString()
    });

    return throwError({
      message: errorMessage,
      code: errorCode,
      status: error.status,
      originalError: error
    });
  }
}