import { Injectable } from '@angular/core';
import { Observable, delay, of, throwError } from 'rxjs';
import { ApiResponse, ResponseMeta, PaginatedResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class ApiSimulationService {
  private generateRequestId(): string {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateResponseMeta(): ResponseMeta {
    return {
      requestId: this.generateRequestId(),
      timestamp: new Date().toISOString(),
      processingTime: Math.floor(Math.random() * 500) + 100, // 100-600ms
      serverNode: `api-node-${Math.floor(Math.random() * 5) + 1}`,
      version: '1.0.0'
    };
  }

  simulateApiCall<T>(
    dataProvider: () => T,
    options: {
      delay?: number;
      errorRate?: number;
      errorMessage?: string;
    } = {}
  ): Observable<ApiResponse<T>> {
    const {
      delay: simulatedDelay = Math.random() * 300 + 100,
      errorRate = 0,
      errorMessage = 'Simulated API error'
    } = options;

    // Simulate random errors
    if (Math.random() < errorRate) {
      return throwError(() => ({
        success: false,
        error: {
          code: 'SIMULATION_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        }
      })).pipe(delay(simulatedDelay));
    }

    const response: ApiResponse<T> = {
      success: true,
      data: dataProvider(),
      meta: this.generateResponseMeta()
    };

    return of(response).pipe(delay(simulatedDelay));
  }

  simulatePaginatedApiCall<T>(
    dataProvider: () => T[],
    page: number,
    size: number,
    totalElements?: number,
    options: {
      delay?: number;
      errorRate?: number;
    } = {}
  ): Observable<ApiResponse<PaginatedResponse<T>>> {
    const {
      delay: simulatedDelay = Math.random() * 400 + 200,
      errorRate = 0
    } = options;

    if (Math.random() < errorRate) {
      return throwError(() => ({
        success: false,
        error: {
          code: 'PAGINATION_ERROR',
          message: 'Failed to fetch paginated data',
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId()
        }
      })).pipe(delay(simulatedDelay));
    }

    const allData = dataProvider();
    const total = totalElements ?? allData.length;
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const pageData = allData.slice(startIndex, endIndex);

    const paginatedResponse: PaginatedResponse<T> = {
      data: pageData,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / size),
        pageSize: size,
        totalElements: total,
        hasNext: endIndex < total,
        hasPrevious: page > 1
      }
    };

    const response: ApiResponse<PaginatedResponse<T>> = {
      success: true,
      data: paginatedResponse,
      meta: this.generateResponseMeta()
    };

    return of(response).pipe(delay(simulatedDelay));
  }

  simulateSlowQuery<T>(dataProvider: () => T): Observable<ApiResponse<T>> {
    return this.simulateApiCall(dataProvider, { delay: 2000 + Math.random() * 3000 });
  }

  simulateFastCache<T>(dataProvider: () => T): Observable<ApiResponse<T>> {
    return this.simulateApiCall(dataProvider, { delay: 50 + Math.random() * 100 });
  }

  simulateHighErrorRate<T>(dataProvider: () => T): Observable<ApiResponse<T>> {
    return this.simulateApiCall(dataProvider, { errorRate: 0.3 });
  }
}