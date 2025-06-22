/**
 * API Simulation Service
 * Demonstrates enterprise API patterns without real backend calls
 * Shows understanding of real-world API challenges and solutions
 */

import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, map, switchMap, tap } from 'rxjs/operators';

import { 
  Asset, 
  Process, 
  Task, 
  ApiResponse, 
  AssetStatus, 
  ProcessStatus, 
  TaskStatus,
  Priority,
  PropertyType
} from '../models';

export interface ApiSimulationConfig {
  enableRandomErrors: boolean;
  errorRate: number; // 0.0 to 1.0
  averageLatency: number; // milliseconds
  maxLatency: number; // milliseconds
  enableNetworkVariability: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ApiSimulationService {
  private config: ApiSimulationConfig = {
    enableRandomErrors: true,
    errorRate: 0.1, // 10% error rate to simulate real-world API issues
    averageLatency: 800,
    maxLatency: 3000,
    enableNetworkVariability: true
  };

  // Simulate realistic data that would come from enterprise systems
  private mockAssets: Asset[] = [
    {
      id: 'ast_89f2d1e4_7b3a_4c9e_a5f6_1d8c9e7f2a3b',
      assetNumber: 'AST-2024-001',
      propertyAddress: {
        street: '123 Financial District Plaza',
        city: 'Dublin',
        county: 'Dublin',
        country: 'Ireland',
        postalCode: 'D02 XY84',
        coordinates: { latitude: 53.3498, longitude: -6.2603 }
      },
      clientName: 'Green Properties Investment Fund',
      investor: 'Dublin Commercial Real Estate Trust',
      propertyType: PropertyType.COMMERCIAL_OFFICE,
      status: AssetStatus.ACTIVE,
      currentValue: 2750000,
      purchasePrice: 2100000,
      purchaseDate: new Date('2023-03-15'),
      lastValuationDate: new Date('2024-11-15'),
      squareFootage: 12500,
      floors: 8,
      yearBuilt: 2018,
      occupancyRate: 0.87,
      netOperatingIncome: 245000,
      grossRentalIncome: 380000,
      operatingExpenses: 135000,
      metadata: {
        buildingClass: 'A',
        parkingSpaces: 45,
        sustainabilityRating: 'BREEAM Excellent',
        keyTenants: ['TechCorp Ltd', 'Legal Partners LLP', 'Consulting Group'],
        lastInspectionDate: new Date('2024-09-20'),
        nextInspectionDue: new Date('2025-03-20'),
        insuranceExpiry: new Date('2025-02-28'),
        propertyManager: 'Dublin Property Management Ltd'
      },
      compliance: {
        firePermitValid: true,
        firePermitExpiry: new Date('2025-06-30'),
        buildingRegulations: 'Compliant',
        accessibilityCompliant: true,
        environmentalCertification: 'ISO 14001',
        healthSafetyAuditDate: new Date('2024-08-15')
      },
      financials: {
        mortgageBalance: 1450000,
        mortgageRate: 0.048,
        monthlyPayment: 12750,
        propertyTaxes: 18500,
        insurance: 8200,
        utilities: 24000,
        maintenance: 32000,
        capexReserve: 50000
      },
      documents: [
        { id: 'doc_001', name: 'Property Deed', type: 'legal', uploadDate: new Date('2023-03-15') },
        { id: 'doc_002', name: 'Fire Certificate', type: 'compliance', uploadDate: new Date('2024-06-30') },
        { id: 'doc_003', name: 'Valuation Report', type: 'financial', uploadDate: new Date('2024-11-15') }
      ],
      createdAt: new Date('2023-03-15'),
      updatedAt: new Date('2024-12-15'),
      createdBy: 'system_import',
      updatedBy: 'john.smith@greenproperties.ie',
      version: 12
    },
    {
      id: 'ast_3a7c5b9f_2e8d_4f1a_9c6e_8b5d7f3a1c9e',
      assetNumber: 'AST-2024-002',
      propertyAddress: {
        street: '456 Riverside Apartments',
        city: 'Cork',
        county: 'Cork',
        country: 'Ireland',
        postalCode: 'T12 AB34',
        coordinates: { latitude: 51.8979, longitude: -8.4694 }
      },
      clientName: 'Emerald Residential Holdings',
      investor: 'Cork Investment Syndicate',
      propertyType: PropertyType.RESIDENTIAL_MULTIFAMILY,
      status: AssetStatus.ACTIVE,
      currentValue: 1850000,
      purchasePrice: 1620000,
      purchaseDate: new Date('2023-07-20'),
      lastValuationDate: new Date('2024-10-30'),
      squareFootage: 8200,
      floors: 4,
      yearBuilt: 2020,
      occupancyRate: 0.94,
      netOperatingIncome: 165000,
      grossRentalIncome: 220000,
      operatingExpenses: 55000,
      metadata: {
        buildingClass: 'B+',
        parkingSpaces: 28,
        sustainabilityRating: 'BER A3',
        unitCount: 24,
        avgRentPerUnit: 1650,
        lastInspectionDate: new Date('2024-10-15'),
        nextInspectionDue: new Date('2025-04-15'),
        insuranceExpiry: new Date('2025-01-31'),
        propertyManager: 'Cork Residential Management'
      },
      compliance: {
        firePermitValid: true,
        firePermitExpiry: new Date('2025-07-31'),
        buildingRegulations: 'Compliant',
        accessibilityCompliant: true,
        environmentalCertification: null,
        healthSafetyAuditDate: new Date('2024-09-10')
      },
      financials: {
        mortgageBalance: 1150000,
        mortgageRate: 0.045,
        monthlyPayment: 7850,
        propertyTaxes: 12300,
        insurance: 5400,
        utilities: 8500,
        maintenance: 18000,
        capexReserve: 25000
      },
      documents: [
        { id: 'doc_004', name: 'Planning Permission', type: 'legal', uploadDate: new Date('2023-07-20') },
        { id: 'doc_005', name: 'Energy Certificate', type: 'compliance', uploadDate: new Date('2024-01-15') }
      ],
      createdAt: new Date('2023-07-20'),
      updatedAt: new Date('2024-12-10'),
      createdBy: 'import_batch_2023_07',
      updatedBy: 'sarah.murphy@emeraldresidential.ie',
      version: 8
    }
  ];

  private mockProcesses: Process[] = [
    {
      id: 'proc_due_diligence_commercial',
      name: 'Commercial Property Due Diligence',
      description: 'Comprehensive due diligence process for commercial real estate acquisitions',
      type: 'acquisition',
      status: ProcessStatus.ACTIVE,
      category: 'Legal & Compliance',
      priority: Priority.HIGH,
      estimatedDuration: 45, // days
      keyFields: [
        {
          id: 'field_001',
          name: 'Property Valuation',
          type: 'currency',
          isRequired: true,
          displayOrder: 1,
          validation: { min: 100000, max: 50000000 },
          helpText: 'Current market valuation by certified appraiser'
        },
        {
          id: 'field_002', 
          name: 'Zoning Classification',
          type: 'dropdown',
          isRequired: true,
          displayOrder: 2,
          options: ['Commercial', 'Mixed Use', 'Industrial', 'Retail'],
          helpText: 'Current zoning designation from local planning authority'
        },
        {
          id: 'field_003',
          name: 'Environmental Assessment',
          type: 'file_upload',
          isRequired: true,
          displayOrder: 3,
          allowedFileTypes: ['.pdf', '.doc', '.docx'],
          helpText: 'Phase I Environmental Site Assessment report'
        }
      ],
      businessRules: [
        {
          id: 'rule_001',
          name: 'Valuation Threshold',
          condition: 'property_value > 2000000',
          action: 'require_secondary_appraisal',
          isActive: true
        }
      ],
      stakeholders: [
        {
          role: 'process_owner',
          userId: 'user_legal_manager',
          name: 'Legal Manager',
          isRequired: true,
          permissions: ['view', 'edit', 'approve']
        },
        {
          role: 'reviewer',
          userId: 'user_senior_analyst',
          name: 'Senior Analyst', 
          isRequired: true,
          permissions: ['view', 'edit']
        }
      ],
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-11-20'),
      createdBy: 'process_admin',
      updatedBy: 'legal.manager@company.com',
      version: 3
    }
  ];

  private mockTasks: Task[] = [
    {
      id: 'task_title_search_001',
      taskNumber: 'TSK-2024-0847',
      name: 'Title Search and Verification',
      description: 'Conduct comprehensive title search and verify chain of ownership for the property',
      type: 'inspection',
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      processId: 'proc_due_diligence_commercial',
      assignedTo: 'user_title_examiner',
      assignedTeam: 'Legal Research Team',
      reporter: 'user_legal_manager',
      dueDate: new Date('2024-12-30'),
      startDate: new Date('2024-12-15'),
      estimatedHours: 16,
      actualHours: 8.5,
      completionPercentage: 60,
      tags: ['legal', 'title', 'ownership', 'due-diligence'],
      attachments: [
        {
          id: 'att_001',
          filename: 'title_search_preliminary.pdf',
          originalName: 'Preliminary Title Search - AST-2024-001.pdf',
          mimeType: 'application/pdf',
          size: 2847392,
          url: '/api/files/attachments/att_001',
          uploadedAt: new Date('2024-12-16'),
          uploadedBy: 'user_title_examiner',
          category: 'PDF'
        }
      ],
      comments: [
        {
          id: 'comment_001',
          content: 'Initial title search shows clean ownership chain. Need to verify liens from 2019-2020 period.',
          authorId: 'user_title_examiner',
          authorName: 'James O\'Brien',
          createdAt: new Date('2024-12-16T10:30:00Z'),
          isInternal: false,
          mentions: ['user_legal_manager']
        }
      ],
      timeEntries: [
        {
          id: 'time_001',
          userId: 'user_title_examiner',
          startTime: new Date('2024-12-15T09:00:00Z'),
          endTime: new Date('2024-12-15T13:00:00Z'),
          duration: 240, // minutes
          description: 'Initial title search and document review',
          billable: true,
          rate: 85,
          category: 'INVESTIGATION'
        }
      ],
      dependencies: [],
      checklistItems: [
        {
          id: 'checklist_001',
          text: 'Search county recorder records',
          isCompleted: true,
          completedAt: new Date('2024-12-15T11:30:00Z'),
          completedBy: 'user_title_examiner',
          order: 1,
          isRequired: true
        },
        {
          id: 'checklist_002', 
          text: 'Verify current ownership documentation',
          isCompleted: true,
          completedAt: new Date('2024-12-15T14:15:00Z'),
          completedBy: 'user_title_examiner',
          order: 2,
          isRequired: true
        },
        {
          id: 'checklist_003',
          text: 'Check for outstanding liens or encumbrances',
          isCompleted: false,
          order: 3,
          isRequired: true
        }
      ],
      customFields: {
        'property_id': 'ast_89f2d1e4_7b3a_4c9e_a5f6_1d8c9e7f2a3b',
        'examiner_license': 'TLE-2024-4892',
        'search_scope': 'full_40_year'
      },
      metadata: {
        complexity: 'MODERATE',
        skillsRequired: ['title_examination', 'legal_research', 'property_law'],
        toolsRequired: ['title_search_software', 'county_records_access'],
        location: {
          type: 'office',
          address: 'Legal Department, 5th Floor'
        },
        weatherDependent: false,
        safetyRequirements: []
      },
      createdAt: new Date('2024-12-15'),
      updatedAt: new Date('2024-12-16T15:45:00Z'),
      createdBy: 'user_legal_manager',
      updatedBy: 'user_title_examiner',
      version: 3
    }
  ];

  constructor() {
    console.log('🏗️ API Simulation Service initialized - Demonstrating enterprise API patterns');
  }

  // Simulate realistic API calls with enterprise patterns
  getAssets(): Observable<ApiResponse<Asset[]>> {
    return this.simulateApiCall(() => ({
      success: true,
      data: this.mockAssets,
      message: 'Assets retrieved successfully',
      meta: {
        total: this.mockAssets.length,
        page: 1,
        limit: 50,
        timestamp: new Date(),
        requestId: this.generateRequestId(),
        apiVersion: '2.1.0',
        processingTime: this.getRandomLatency()
      }
    }));
  }

  getAssetById(id: string): Observable<ApiResponse<Asset>> {
    const asset = this.mockAssets.find(a => a.id === id);
    
    if (!asset) {
      return this.simulateApiError(404, 'ASSET_NOT_FOUND', `Asset with ID ${id} not found`);
    }

    return this.simulateApiCall(() => ({
      success: true,
      data: asset,
      message: 'Asset retrieved successfully',
      meta: {
        timestamp: new Date(),
        requestId: this.generateRequestId(),
        apiVersion: '2.1.0',
        processingTime: this.getRandomLatency()
      }
    }));
  }

  getProcesses(): Observable<ApiResponse<Process[]>> {
    return this.simulateApiCall(() => ({
      success: true,
      data: this.mockProcesses,
      message: 'Processes retrieved successfully', 
      meta: {
        total: this.mockProcesses.length,
        timestamp: new Date(),
        requestId: this.generateRequestId(),
        apiVersion: '2.1.0',
        processingTime: this.getRandomLatency()
      }
    }));
  }

  getTasksForProcess(processId: string): Observable<ApiResponse<Task[]>> {
    const tasks = this.mockTasks.filter(t => t.processId === processId);
    
    return this.simulateApiCall(() => ({
      success: true,
      data: tasks,
      message: `Tasks for process ${processId} retrieved successfully`,
      meta: {
        total: tasks.length,
        processId,
        timestamp: new Date(),
        requestId: this.generateRequestId(),
        apiVersion: '2.1.0',
        processingTime: this.getRandomLatency()
      }
    }));
  }

  searchAssets(query: string): Observable<ApiResponse<Asset[]>> {
    const filtered = this.mockAssets.filter(asset => 
      asset.assetNumber.toLowerCase().includes(query.toLowerCase()) ||
      asset.propertyAddress.street.toLowerCase().includes(query.toLowerCase()) ||
      asset.clientName.toLowerCase().includes(query.toLowerCase())
    );

    return this.simulateApiCall(() => ({
      success: true,
      data: filtered,
      message: `Search completed for query: "${query}"`,
      meta: {
        total: filtered.length,
        query,
        searchTime: this.getRandomLatency(),
        suggestions: this.generateSearchSuggestions(query),
        timestamp: new Date(),
        requestId: this.generateRequestId(),
        apiVersion: '2.1.0'
      }
    }));
  }

  // Demonstrate enterprise error scenarios
  private simulateApiCall<T>(dataProvider: () => ApiResponse<T>): Observable<ApiResponse<T>> {
    // Simulate various enterprise API scenarios
    const latency = this.getRandomLatency();
    
    return timer(latency).pipe(
      switchMap(() => {
        // Simulate random network/server errors (enterprise reality)
        if (this.config.enableRandomErrors && Math.random() < this.config.errorRate) {
          return this.getRandomError();
        }
        
        // Simulate successful response
        const response = dataProvider();
        response.meta = {
          ...response.meta,
          processingTime: latency,
          serverNode: this.getRandomServerNode()
        };
        
        return of(response);
      }),
      tap(response => {
        // Log API calls for monitoring (enterprise pattern)
        console.log('📡 API Call Simulation:', {
          endpoint: 'simulated',
          latency: `${latency}ms`,
          success: response.success,
          timestamp: new Date().toISOString(),
          requestId: response.meta?.requestId
        });
      })
    );
  }

  private simulateApiError(status: number, code: string, message: string): Observable<never> {
    const error = {
      status,
      error: {
        code,
        message,
        timestamp: new Date(),
        requestId: this.generateRequestId(),
        details: this.getErrorDetails(code)
      }
    };

    return timer(this.getRandomLatency()).pipe(
      switchMap(() => throwError(error))
    );
  }

  private getRandomError(): Observable<never> {
    const errors = [
      { status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error occurred' },
      { status: 503, code: 'SERVICE_UNAVAILABLE', message: 'Service temporarily unavailable' },
      { status: 429, code: 'RATE_LIMITED', message: 'Rate limit exceeded' },
      { status: 502, code: 'BAD_GATEWAY', message: 'Bad gateway error' },
      { status: 408, code: 'REQUEST_TIMEOUT', message: 'Request timeout' }
    ];

    const randomError = errors[Math.floor(Math.random() * errors.length)];
    return this.simulateApiError(randomError.status, randomError.code, randomError.message);
  }

  private getRandomLatency(): number {
    if (!this.config.enableNetworkVariability) {
      return this.config.averageLatency;
    }

    // Simulate realistic network variability
    const baseLatency = this.config.averageLatency;
    const variation = (Math.random() - 0.5) * 2 * (this.config.maxLatency - baseLatency);
    return Math.max(50, Math.floor(baseLatency + variation));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private getRandomServerNode(): string {
    const nodes = ['api-node-01', 'api-node-02', 'api-node-03', 'api-gateway-lb'];
    return nodes[Math.floor(Math.random() * nodes.length)];
  }

  private generateSearchSuggestions(query: string): string[] {
    // Simulate intelligent search suggestions
    const suggestions = [
      'AST-2024-001',
      'Dublin Commercial',
      'Green Properties',
      'Cork Residential'
    ];
    
    return suggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase()) && 
      s.toLowerCase() !== query.toLowerCase()
    ).slice(0, 3);
  }

  private getErrorDetails(code: string): any {
    const details: Record<string, any> = {
      'ASSET_NOT_FOUND': {
        suggestion: 'Verify the asset ID and try again',
        supportAction: 'Contact support if this asset should exist'
      },
      'INTERNAL_SERVER_ERROR': {
        suggestion: 'Please try again in a few moments',
        supportAction: 'Contact support if the problem persists',
        retryAfter: 30000
      },
      'RATE_LIMITED': {
        suggestion: 'Please wait before making another request',
        retryAfter: 60000,
        limitInfo: {
          limit: 100,
          windowMs: 60000,
          remaining: 0
        }
      }
    };

    return details[code] || { suggestion: 'Please try again later' };
  }

  // Configuration methods for testing different scenarios
  configureSimulation(config: Partial<ApiSimulationConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('⚙️ API Simulation configured:', this.config);
  }

  // Simulate realistic database/cache scenarios
  simulateSlowQuery(): void {
    this.configureSimulation({ 
      averageLatency: 2500, 
      maxLatency: 5000,
      enableNetworkVariability: true 
    });
  }

  simulateHighErrorRate(): void {
    this.configureSimulation({ 
      enableRandomErrors: true, 
      errorRate: 0.3 
    });
  }

  simulateFastCache(): void {
    this.configureSimulation({ 
      averageLatency: 150, 
      maxLatency: 300,
      enableRandomErrors: false 
    });
  }
}