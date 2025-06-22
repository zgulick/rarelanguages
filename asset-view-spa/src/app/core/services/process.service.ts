import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, delay } from 'rxjs/operators';
import { 
  Process, 
  ProcessSummary, 
  ProcessType, 
  ProcessStatus, 
  ProcessKeyField,
  FieldType
} from '../../models';

@Injectable({
  providedIn: 'root'
})
export class ProcessService {
  private readonly API_URL = '/api/processes';

  private mockProcesses: Process[] = [
    {
      id: '1',
      name: 'Property Inspection',
      description: 'Comprehensive property condition assessment',
      type: ProcessType.INSPECTION,
      status: ProcessStatus.IN_PROGRESS,
      color: '#2196F3',
      icon: 'visibility',
      order: 1,
      keyFields: [
        {
          id: 'inspection-date',
          name: 'inspectionDate',
          value: new Date('2024-12-20'),
          type: FieldType.DATE,
          label: 'Inspection Date',
          required: true,
          editable: true
        },
        {
          id: 'inspector',
          name: 'inspector',
          value: 'John Smith',
          type: FieldType.TEXT,
          label: 'Inspector Name',
          required: true,
          editable: true
        },
        {
          id: 'overall-condition',
          name: 'overallCondition',
          value: 'Good',
          type: FieldType.SELECT,
          label: 'Overall Condition',
          required: true,
          editable: true
        }
      ],
      tasks: ['1', '2', '3', '4']
    },
    {
      id: '2',
      name: 'Maintenance Tasks',
      description: 'Property maintenance and repairs',
      type: ProcessType.MAINTENANCE,
      status: ProcessStatus.IN_PROGRESS,
      color: '#FF9800',
      icon: 'build',
      order: 2,
      keyFields: [
        {
          id: 'next-maintenance',
          name: 'nextMaintenance',
          value: new Date('2025-01-15'),
          type: FieldType.DATE,
          label: 'Next Maintenance Due',
          required: false,
          editable: true
        },
        {
          id: 'maintenance-budget',
          name: 'maintenanceBudget',
          value: 5000,
          type: FieldType.NUMBER,
          label: 'Annual Budget (€)',
          required: true,
          editable: true
        }
      ],
      tasks: ['1', '2', '3', '4']
    },
    {
      id: '3',
      name: 'Compliance Check',
      description: 'Regulatory compliance verification',
      type: ProcessType.COMPLIANCE,
      status: ProcessStatus.COMPLETED,
      color: '#4CAF50',
      icon: 'verified',
      order: 3,
      keyFields: [
        {
          id: 'compliance-status',
          name: 'complianceStatus',
          value: 'Compliant',
          type: FieldType.SELECT,
          label: 'Compliance Status',
          required: true,
          editable: false
        },
        {
          id: 'last-audit',
          name: 'lastAudit',
          value: new Date('2024-11-15'),
          type: FieldType.DATE,
          label: 'Last Audit Date',
          required: true,
          editable: false
        }
      ],
      tasks: ['1', '2', '3', '4']
    },
    {
      id: '4',
      name: 'Tenant Management',
      description: 'Tenant relations and lease management',
      type: ProcessType.TENANT_MANAGEMENT,
      status: ProcessStatus.IN_PROGRESS,
      color: '#9C27B0',
      icon: 'people',
      order: 4,
      keyFields: [
        {
          id: 'occupancy-rate',
          name: 'occupancyRate',
          value: 95,
          type: FieldType.NUMBER,
          label: 'Occupancy Rate (%)',
          required: false,
          editable: false
        },
        {
          id: 'lease-renewal',
          name: 'leaseRenewal',
          value: new Date('2025-03-01'),
          type: FieldType.DATE,
          label: 'Next Lease Renewal',
          required: false,
          editable: true
        }
      ],
      tasks: ['1', '2', '3', '4']
    },
    {
      id: '5',
      name: 'Financial Analysis',
      description: 'Property financial performance tracking',
      type: ProcessType.FINANCIAL,
      status: ProcessStatus.IN_PROGRESS,
      color: '#607D8B',
      icon: 'trending_up',
      order: 5,
      keyFields: [
        {
          id: 'monthly-income',
          name: 'monthlyIncome',
          value: 12500,
          type: FieldType.NUMBER,
          label: 'Monthly Income (€)',
          required: true,
          editable: true
        },
        {
          id: 'roi',
          name: 'roi',
          value: 8.5,
          type: FieldType.NUMBER,
          label: 'ROI (%)',
          required: false,
          editable: false
        }
      ],
      tasks: ['1', '2', '3', '4']
    }
  ];

  constructor(private http: HttpClient) {}

  getProcessesByAssetId(assetId: string): Observable<ProcessSummary[]> {
    return of(this.mockProcesses).pipe(
      delay(400),
      map(processes => processes.map(this.mapToProcessSummary))
    );
  }

  getProcessById(processId: string): Observable<Process | null> {
    return of(this.mockProcesses).pipe(
      delay(300),
      map(processes => processes.find(p => p.id === processId) || null)
    );
  }

  updateProcess(process: Process): Observable<Process> {
    return of(process).pipe(
      delay(500),
      map(updatedProcess => {
        const index = this.mockProcesses.findIndex(p => p.id === updatedProcess.id);
        if (index !== -1) {
          this.mockProcesses[index] = updatedProcess;
        }
        return updatedProcess;
      })
    );
  }

  updateProcessKeyFields(processId: string, keyFields: ProcessKeyField[]): Observable<ProcessKeyField[]> {
    return of(keyFields).pipe(
      delay(300),
      map(fields => {
        const processIndex = this.mockProcesses.findIndex(p => p.id === processId);
        if (processIndex !== -1) {
          this.mockProcesses[processIndex].keyFields = fields;
        }
        return fields;
      })
    );
  }

  private mapToProcessSummary(process: Process): ProcessSummary {
    return {
      id: process.id,
      name: process.name,
      type: process.type,
      status: process.status,
      taskCount: process.tasks.length,
      completedTaskCount: Math.floor(process.tasks.length * 0.6), // Mock completed count
      color: process.color,
      icon: process.icon
    };
  }
}