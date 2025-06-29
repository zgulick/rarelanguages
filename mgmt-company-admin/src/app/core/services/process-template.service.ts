import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  ProcessTemplate, 
  ProcessTemplateSearchParams,
  ProcessTemplateSearchResult,
  ProcessTemplateCategory,
  ApiResponse,
  PaginatedResponse
} from '../models';
import { ApiSimulationService } from './api-simulation.service';

@Injectable({
  providedIn: 'root'
})
export class ProcessTemplateService {
  private processTemplates: ProcessTemplate[] = this.generateMockProcessTemplates();
  
  constructor(private apiSimulation: ApiSimulationService) {}

  searchProcessTemplates(params: ProcessTemplateSearchParams): Observable<ApiResponse<ProcessTemplateSearchResult>> {
    return this.apiSimulation.simulateApiCall(() => {
      const filtered = this.filterTemplates(params);
      const total = this.getTotalFilteredCount(params);
      const startIndex = (params.page - 1) * params.size;
      const endIndex = startIndex + params.size;
      const pageData = filtered.slice(startIndex, endIndex);

      return {
        templates: pageData,
        totalElements: total,
        totalPages: Math.ceil(total / params.size),
        currentPage: params.page,
        pageSize: params.size
      };
    }, { delay: 400 });
  }

  getProcessTemplateById(id: string): Observable<ApiResponse<ProcessTemplate>> {
    return this.apiSimulation.simulateApiCall(() => {
      const template = this.processTemplates.find(t => t.id === id);
      if (!template) {
        throw new Error(`Process template with ID ${id} not found`);
      }
      return template;
    });
  }

  getProcessTemplatesByIds(ids: string[]): Observable<ApiResponse<ProcessTemplate[]>> {
    return this.apiSimulation.simulateApiCall(() => {
      return this.processTemplates.filter(t => ids.includes(t.id));
    });
  }

  getCategories(): Observable<ApiResponse<ProcessTemplateCategory[]>> {
    return this.apiSimulation.simulateApiCall(() => {
      const categoryMap: { [key: string]: number } = {};
      
      this.processTemplates.forEach(template => {
        categoryMap[template.category] = (categoryMap[template.category] || 0) + 1;
      });

      return Object.entries(categoryMap).map(([name, count]) => ({
        name,
        count
      }));
    });
  }

  private filterTemplates(params: ProcessTemplateSearchParams): ProcessTemplate[] {
    let filtered = [...this.processTemplates];

    // Apply search filter
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm) ||
        template.description.toLowerCase().includes(searchTerm) ||
        template.managementCompany.toLowerCase().includes(searchTerm) ||
        template.processType.toLowerCase().includes(searchTerm)
      );
    }

    // Apply category filter
    if (params.category) {
      filtered = filtered.filter(template => template.category === params.category);
    }

    // Apply process type filter
    if (params.processType) {
      filtered = filtered.filter(template => template.processType === params.processType);
    }

    // Apply sorting
    if (params.sort) {
      const [field, direction] = params.sort.split(',');
      filtered.sort((a, b) => {
        let aVal: any = a[field as keyof ProcessTemplate];
        let bVal: any = b[field as keyof ProcessTemplate];

        if (aVal instanceof Date) aVal = aVal.getTime();
        if (bVal instanceof Date) bVal = bVal.getTime();

        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (direction === 'desc') {
          return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
        } else {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        }
      });
    }

    return filtered;
  }

  private getTotalFilteredCount(params: ProcessTemplateSearchParams): number {
    return this.filterTemplates(params).length;
  }

  private generateMockProcessTemplates(): ProcessTemplate[] {
    const categories = [
      'Tenant Management',
      'Property Maintenance',
      'Financial Processing',
      'Legal & Compliance',
      'Marketing & Leasing',
      'Emergency Response',
      'Vendor Management',
      'Inspection & Quality'
    ];

    const processTypes = [
      'Automated',
      'Manual Review',
      'Approval Required',
      'Notification Only',
      'Escalation'
    ];

    const managementCompanies = [
      'Atlantic Property Management LLC',
      'Meridian Real Estate Services',
      'Summit Property Group',
      'Cornerstone Management Solutions',
      'Pinnacle Property Advisors',
      'Urban Living Solutions',
      'Premier Property Partners',
      'Residential Excellence Group'
    ];

    const templates: ProcessTemplate[] = [];

    // Generate 250+ templates for realistic pagination testing
    for (let i = 1; i <= 275; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const processType = processTypes[Math.floor(Math.random() * processTypes.length)];
      const company = managementCompanies[Math.floor(Math.random() * managementCompanies.length)];
      
      templates.push({
        id: `pt_${String(i).padStart(3, '0')}`,
        name: this.generateTemplateName(category, i),
        version: `${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`,
        statusDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
        managementCompany: company,
        description: this.generateTemplateDescription(category),
        category,
        isActive: Math.random() > 0.1, // 90% active
        processType
      });
    }

    return templates.sort((a, b) => a.name.localeCompare(b.name));
  }

  private generateTemplateName(category: string, index: number): string {
    const namePatterns: { [key: string]: string[] } = {
      'Tenant Management': [
        'Tenant Application Processing',
        'Lease Renewal Workflow',
        'Move-in Checklist Process',
        'Move-out Inspection Protocol',
        'Tenant Communication Flow',
        'Late Payment Collection Process',
        'Tenant Complaint Resolution',
        'Lease Violation Notice System',
        'Tenant Screening Workflow',
        'Rent Increase Notification Process'
      ],
      'Property Maintenance': [
        'Routine Maintenance Schedule',
        'Emergency Repair Response',
        'Preventive Maintenance Protocol',
        'Work Order Management Flow',
        'Vendor Selection Process',
        'Maintenance Cost Approval',
        'Equipment Replacement Workflow',
        'Property Inspection Checklist',
        'Seasonal Maintenance Program',
        'Maintenance Quality Control'
      ],
      'Financial Processing': [
        'Monthly Rent Collection',
        'Security Deposit Management',
        'Expense Tracking Process',
        'Budget Approval Workflow',
        'Financial Reporting System',
        'Invoice Processing Flow',
        'Payment Reconciliation',
        'Late Fee Assessment',
        'Refund Processing Protocol',
        'Financial Audit Preparation'
      ],
      'Legal & Compliance': [
        'Legal Document Review',
        'Compliance Monitoring System',
        'Contract Approval Process',
        'Regulatory Filing Workflow',
        'Insurance Claim Processing',
        'Legal Notice Distribution',
        'Compliance Audit Protocol',
        'Risk Assessment Process',
        'Legal Case Management',
        'Regulatory Update Distribution'
      ],
      'Marketing & Leasing': [
        'Property Listing Management',
        'Lead Qualification Process',
        'Showing Scheduling System',
        'Application Review Workflow',
        'Marketing Campaign Management',
        'Vacancy Marketing Protocol',
        'Prospect Follow-up Process',
        'Lease Signing Coordination',
        'Market Analysis Workflow',
        'Pricing Strategy Review'
      ],
      'Emergency Response': [
        'Emergency Contact Protocol',
        'Crisis Communication Plan',
        'Emergency Repair Dispatch',
        'Evacuation Procedure',
        'After-hours Response System',
        'Emergency Vendor Coordination',
        'Incident Reporting Process',
        'Emergency Fund Access',
        'Recovery Planning Workflow',
        'Emergency Training Protocol'
      ],
      'Vendor Management': [
        'Vendor Onboarding Process',
        'Performance Review System',
        'Contract Negotiation Flow',
        'Vendor Payment Processing',
        'Quality Assurance Protocol',
        'Vendor Selection Criteria',
        'Service Level Monitoring',
        'Vendor Relationship Management',
        'Procurement Approval Process',
        'Vendor Performance Metrics'
      ],
      'Inspection & Quality': [
        'Property Condition Assessment',
        'Quality Control Checklist',
        'Annual Inspection Protocol',
        'Safety Inspection Process',
        'Environmental Assessment',
        'Code Compliance Review',
        'Maintenance Quality Check',
        'Tenant Move-in Inspection',
        'Move-out Damage Assessment',
        'Third-party Inspection Coordination'
      ]
    };

    const patterns = namePatterns[category] || ['Generic Process Template'];
    const baseName = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Add version suffix for variety
    const suffixes = ['', ' - Enhanced', ' - Standard', ' - Premium', ' - Express', ' - Deluxe'];
    const suffix = Math.random() > 0.7 ? suffixes[Math.floor(Math.random() * suffixes.length)] : '';
    
    return `${baseName}${suffix}`;
  }

  private generateTemplateDescription(category: string): string {
    const descriptions: { [key: string]: string[] } = {
      'Tenant Management': [
        'Streamlined process for managing tenant applications, background checks, and lease agreements',
        'Comprehensive workflow for tenant communication, maintenance requests, and issue resolution',
        'Automated system for lease renewals, rent adjustments, and tenant retention strategies'
      ],
      'Property Maintenance': [
        'Efficient maintenance request processing with automated work order generation and vendor coordination',
        'Preventive maintenance scheduling system with equipment tracking and lifecycle management',
        'Emergency repair response protocol with 24/7 coordination and priority escalation'
      ],
      'Financial Processing': [
        'Automated rent collection system with payment tracking and late fee management',
        'Comprehensive financial reporting with budget tracking and expense categorization',
        'Invoice processing workflow with approval chains and payment authorization'
      ],
      'Legal & Compliance': [
        'Legal document management system with automated compliance monitoring and reporting',
        'Regulatory compliance tracking with deadline management and audit preparation',
        'Contract review and approval process with legal team coordination'
      ],
      'Marketing & Leasing': [
        'Property marketing automation with listing distribution and lead management',
        'Prospect qualification system with showing coordination and application processing',
        'Market analysis workflow with pricing optimization and competitive intelligence'
      ],
      'Emergency Response': [
        'Emergency response coordination with automated notifications and vendor dispatch',
        'Crisis management protocol with communication plans and recovery procedures',
        'After-hours emergency handling with escalation procedures and response tracking'
      ],
      'Vendor Management': [
        'Vendor onboarding and management system with performance tracking and contract oversight',
        'Service provider coordination with quality assurance and payment processing',
        'Procurement workflow with vendor selection criteria and approval processes'
      ],
      'Inspection & Quality': [
        'Property inspection management with scheduling, documentation, and follow-up procedures',
        'Quality control system with checklists, compliance verification, and corrective actions',
        'Assessment workflow with reporting, recommendations, and improvement tracking'
      ]
    };

    const categoryDescriptions = descriptions[category] || ['Standard process template for property management operations'];
    return categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
  }
}