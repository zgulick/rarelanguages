import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { 
  Subscription, 
  SubscriptionCategory,
  SubscriptionSearchResult,
  ApiResponse 
} from '../models';
import { ApiSimulationService } from './api-simulation.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private subscriptions: Subscription[] = this.generateMockSubscriptions();
  
  constructor(private apiSimulation: ApiSimulationService) {}

  getSubscriptions(): Observable<ApiResponse<SubscriptionSearchResult>> {
    return this.apiSimulation.simulateApiCall(() => {
      const categories = [...new Set(this.subscriptions.map(s => s.category))];
      
      return {
        subscriptions: this.subscriptions,
        categories,
        total: this.subscriptions.length
      };
    });
  }

  getSubscriptionsByCategory(): Observable<ApiResponse<SubscriptionCategory[]>> {
    return this.apiSimulation.simulateApiCall(() => {
      const categories: { [key: string]: Subscription[] } = {};
      
      this.subscriptions.forEach(subscription => {
        if (!categories[subscription.category]) {
          categories[subscription.category] = [];
        }
        categories[subscription.category].push(subscription);
      });

      return Object.entries(categories).map(([name, subscriptions]) => ({
        name,
        subscriptions
      }));
    });
  }

  searchSubscriptions(query: string, category?: string): Observable<ApiResponse<SubscriptionSearchResult>> {
    return this.apiSimulation.simulateApiCall(() => {
      let filtered = this.subscriptions;
      
      if (category) {
        filtered = filtered.filter(s => s.category === category);
      }
      
      if (query.trim()) {
        const searchTerm = query.toLowerCase();
        filtered = filtered.filter(s => 
          s.name.toLowerCase().includes(searchTerm) ||
          s.description.toLowerCase().includes(searchTerm)
        );
      }

      const categories = [...new Set(this.subscriptions.map(s => s.category))];
      
      return {
        subscriptions: filtered,
        categories,
        total: filtered.length
      };
    });
  }

  getSubscriptionsByIds(ids: string[]): Observable<ApiResponse<Subscription[]>> {
    return this.apiSimulation.simulateApiCall(() => {
      return this.subscriptions.filter(s => ids.includes(s.id));
    });
  }

  private generateMockSubscriptions(): Subscription[] {
    return [
      // Property Management
      {
        id: 'sub_001',
        name: 'Basic Property Management',
        description: 'Essential property management tools including tenant tracking and basic maintenance',
        category: 'Property Management',
        isActive: true,
        lastUpdated: new Date('2024-12-15')
      },
      {
        id: 'sub_002',
        name: 'Advanced Property Analytics',
        description: 'Comprehensive analytics and reporting for property performance optimization',
        category: 'Property Management',
        isActive: true,
        lastUpdated: new Date('2024-12-10')
      },
      {
        id: 'sub_003',
        name: 'Multi-Property Portfolio',
        description: 'Manage multiple properties with portfolio-level insights and controls',
        category: 'Property Management',
        isActive: true,
        lastUpdated: new Date('2024-12-08')
      },

      // Financial Services
      {
        id: 'sub_004',
        name: 'Automated Billing',
        description: 'Streamlined rent collection and automated invoice generation',
        category: 'Financial Services',
        isActive: true,
        lastUpdated: new Date('2024-12-12')
      },
      {
        id: 'sub_005',
        name: 'Financial Reporting Suite',
        description: 'Comprehensive financial reports and tax preparation assistance',
        category: 'Financial Services',
        isActive: true,
        lastUpdated: new Date('2024-12-05')
      },
      {
        id: 'sub_006',
        name: 'Payment Processing',
        description: 'Integrated payment gateway with multiple payment options',
        category: 'Financial Services',
        isActive: true,
        lastUpdated: new Date('2024-12-01')
      },

      // Maintenance & Operations
      {
        id: 'sub_007',
        name: 'Maintenance Management',
        description: 'Work order tracking and vendor management system',
        category: 'Maintenance & Operations',
        isActive: true,
        lastUpdated: new Date('2024-12-14')
      },
      {
        id: 'sub_008',
        name: 'Preventive Maintenance',
        description: 'Scheduled maintenance and equipment lifecycle management',
        category: 'Maintenance & Operations',
        isActive: true,
        lastUpdated: new Date('2024-12-11')
      },
      {
        id: 'sub_009',
        name: 'Emergency Response',
        description: '24/7 emergency maintenance coordination and response system',
        category: 'Maintenance & Operations',
        isActive: true,
        lastUpdated: new Date('2024-12-03')
      },

      // Tenant Services
      {
        id: 'sub_010',
        name: 'Tenant Portal',
        description: 'Self-service portal for tenants with payment and communication tools',
        category: 'Tenant Services',
        isActive: true,
        lastUpdated: new Date('2024-12-13')
      },
      {
        id: 'sub_011',
        name: 'Lease Management',
        description: 'Digital lease signing and renewal management',
        category: 'Tenant Services',
        isActive: true,
        lastUpdated: new Date('2024-12-09')
      },
      {
        id: 'sub_012',
        name: 'Communication Hub',
        description: 'Integrated messaging and notification system for tenant communication',
        category: 'Tenant Services',
        isActive: true,
        lastUpdated: new Date('2024-12-07')
      },

      // Compliance & Legal
      {
        id: 'sub_013',
        name: 'Compliance Monitoring',
        description: 'Automated compliance tracking for local and federal regulations',
        category: 'Compliance & Legal',
        isActive: true,
        lastUpdated: new Date('2024-12-06')
      },
      {
        id: 'sub_014',
        name: 'Legal Document Management',
        description: 'Secure storage and management of legal documents and contracts',
        category: 'Compliance & Legal',
        isActive: true,
        lastUpdated: new Date('2024-12-04')
      },
      {
        id: 'sub_015',
        name: 'Risk Assessment',
        description: 'Property risk analysis and insurance optimization tools',
        category: 'Compliance & Legal',
        isActive: true,
        lastUpdated: new Date('2024-12-02')
      },

      // Technology & Integration
      {
        id: 'sub_016',
        name: 'API Access',
        description: 'Full API access for custom integrations and third-party tools',
        category: 'Technology & Integration',
        isActive: true,
        lastUpdated: new Date('2024-12-15')
      },
      {
        id: 'sub_017',
        name: 'Mobile App Premium',
        description: 'Enhanced mobile application with offline capabilities',
        category: 'Technology & Integration',
        isActive: true,
        lastUpdated: new Date('2024-12-10')
      },
      {
        id: 'sub_018',
        name: 'Data Export & Backup',
        description: 'Automated data backup and export services',
        category: 'Technology & Integration',
        isActive: true,
        lastUpdated: new Date('2024-12-08')
      },

      // Marketing & Leasing
      {
        id: 'sub_019',
        name: 'Vacancy Marketing',
        description: 'Automated listing distribution and lead management',
        category: 'Marketing & Leasing',
        isActive: true,
        lastUpdated: new Date('2024-12-12')
      },
      {
        id: 'sub_020',
        name: 'Virtual Tours',
        description: '360-degree virtual tour creation and hosting',
        category: 'Marketing & Leasing',
        isActive: true,
        lastUpdated: new Date('2024-12-09')
      },
      {
        id: 'sub_021',
        name: 'Lead Management CRM',
        description: 'Customer relationship management for prospective tenants',
        category: 'Marketing & Leasing',
        isActive: true,
        lastUpdated: new Date('2024-12-07')
      },

      // Analytics & Reporting
      {
        id: 'sub_022',
        name: 'Business Intelligence',
        description: 'Advanced analytics dashboard with predictive insights',
        category: 'Analytics & Reporting',
        isActive: true,
        lastUpdated: new Date('2024-12-11')
      },
      {
        id: 'sub_023',
        name: 'Custom Reports',
        description: 'Build and schedule custom reports with flexible data visualization',
        category: 'Analytics & Reporting',
        isActive: true,
        lastUpdated: new Date('2024-12-05')
      },
      {
        id: 'sub_024',
        name: 'Market Analysis',
        description: 'Comparative market analysis and rent optimization recommendations',
        category: 'Analytics & Reporting',
        isActive: true,
        lastUpdated: new Date('2024-12-03')
      }
    ];
  }
}