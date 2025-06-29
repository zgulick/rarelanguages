import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map } from 'rxjs';
import { 
  ManagementCompany, 
  ManagementCompanyCreate, 
  ManagementCompanyUpdate,
  ManagementCompanyListItem,
  ApiResponse 
} from '../models';
import { ApiSimulationService } from './api-simulation.service';

@Injectable({
  providedIn: 'root'
})
export class ManagementCompanyService {
  private managementCompanies: ManagementCompany[] = this.generateMockData();
  private companiesSubject = new BehaviorSubject<ManagementCompany[]>(this.managementCompanies);
  private searchTermSubject = new BehaviorSubject<string>('');

  public readonly companies$ = this.companiesSubject.asObservable();
  public readonly searchTerm$ = this.searchTermSubject.asObservable();

  public readonly filteredCompanies$ = combineLatest([
    this.companies$,
    this.searchTerm$
  ]).pipe(
    map(([companies, searchTerm]) => {
      if (!searchTerm.trim()) {
        return companies;
      }
      
      const term = searchTerm.toLowerCase();
      return companies.filter(company => 
        company.name.toLowerCase().includes(term) ||
        company.primaryContact.firstName.toLowerCase().includes(term) ||
        company.primaryContact.lastName.toLowerCase().includes(term) ||
        company.primaryContact.email.toLowerCase().includes(term)
      );
    })
  );

  constructor(private apiSimulation: ApiSimulationService) {}

  getManagementCompanies(): Observable<ApiResponse<ManagementCompanyListItem[]>> {
    return this.apiSimulation.simulateApiCall(() => {
      return this.managementCompanies.map(company => ({
        id: company.id!,
        name: company.name,
        type: company.type,
        primaryContactName: `${company.primaryContact.firstName} ${company.primaryContact.lastName}`,
        primaryContactEmail: company.primaryContact.email,
        status: company.status,
        createdDate: company.createdDate!,
        lastModified: company.lastModified!
      }));
    });
  }

  getManagementCompanyById(id: string): Observable<ApiResponse<ManagementCompany>> {
    return this.apiSimulation.simulateApiCall(() => {
      const company = this.managementCompanies.find(c => c.id === id);
      if (!company) {
        throw new Error(`Management company with ID ${id} not found`);
      }
      return company;
    });
  }

  createManagementCompany(company: ManagementCompanyCreate): Observable<ApiResponse<ManagementCompany>> {
    return this.apiSimulation.simulateApiCall(() => {
      const newCompany: ManagementCompany = {
        ...company,
        id: this.generateId(),
        createdDate: new Date(),
        lastModified: new Date()
      };

      this.managementCompanies.push(newCompany);
      this.companiesSubject.next([...this.managementCompanies]);
      
      return newCompany;
    });
  }

  updateManagementCompany(id: string, updates: Partial<ManagementCompany>): Observable<ApiResponse<ManagementCompany>> {
    return this.apiSimulation.simulateApiCall(() => {
      const index = this.managementCompanies.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error(`Management company with ID ${id} not found`);
      }

      const updatedCompany: ManagementCompany = {
        ...this.managementCompanies[index],
        ...updates,
        id,
        lastModified: new Date()
      };

      this.managementCompanies[index] = updatedCompany;
      this.companiesSubject.next([...this.managementCompanies]);
      
      return updatedCompany;
    });
  }

  deleteManagementCompany(id: string): Observable<ApiResponse<boolean>> {
    return this.apiSimulation.simulateApiCall(() => {
      const index = this.managementCompanies.findIndex(c => c.id === id);
      if (index === -1) {
        throw new Error(`Management company with ID ${id} not found`);
      }

      this.managementCompanies.splice(index, 1);
      this.companiesSubject.next([...this.managementCompanies]);
      
      return true;
    });
  }

  setSearchTerm(term: string): void {
    this.searchTermSubject.next(term);
  }

  private generateId(): string {
    return 'mc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private generateMockData(): ManagementCompany[] {
    const companies: ManagementCompany[] = [
      {
        id: 'mc_001',
        name: 'Atlantic Property Management LLC',
        type: 'rental',
        address: {
          street: '123 Business Plaza Drive',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'United States'
        },
        primaryContact: {
          firstName: 'Sarah',
          lastName: 'Johnson',
          email: 'sarah.johnson@atlanticpm.com',
          phone: '+1 (555) 123-4567',
          title: 'Managing Director'
        },
        branding: {
          primaryColor: '#1976d2',
          secondaryColor: '#424242',
          tertiaryColor: '#f5f5f5',
          useDefaultColors: false,
          logoUrl: '/assets/logos/atlantic-pm-logo.svg'
        },
        languageFileId: 'lang_001',
        subscriptionIds: ['sub_001', 'sub_003', 'sub_007'],
        processTemplateIds: ['pt_001', 'pt_003', 'pt_005'],
        createdDate: new Date('2024-01-15'),
        lastModified: new Date('2024-12-20'),
        status: 'active'
      },
      {
        id: 'mc_002',
        name: 'Meridian Real Estate Services',
        type: 'mortgage',
        address: {
          street: '456 Corporate Center',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'United States'
        },
        primaryContact: {
          firstName: 'Michael',
          lastName: 'Chen',
          email: 'michael.chen@meridianres.com',
          phone: '+1 (555) 234-5678',
          title: 'CEO'
        },
        branding: {
          primaryColor: '#2e7d32',
          secondaryColor: '#388e3c',
          tertiaryColor: '#e8f5e8',
          useDefaultColors: false
        },
        languageFileId: 'lang_002',
        subscriptionIds: ['sub_002', 'sub_004', 'sub_008'],
        processTemplateIds: ['pt_002', 'pt_004', 'pt_006'],
        createdDate: new Date('2024-02-01'),
        lastModified: new Date('2024-12-18'),
        status: 'active'
      },
      {
        id: 'mc_003',
        name: 'Summit Property Group',
        type: 'preservation',
        address: {
          street: '789 Executive Boulevard',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'United States'
        },
        primaryContact: {
          firstName: 'Emily',
          lastName: 'Rodriguez',
          email: 'emily.rodriguez@summitpg.com',
          phone: '+1 (555) 345-6789',
          title: 'Operations Manager'
        },
        branding: {
          primaryColor: '#1976d2',
          secondaryColor: '#424242',
          tertiaryColor: '#f5f5f5',
          useDefaultColors: true
        },
        languageFileId: 'lang_001',
        subscriptionIds: ['sub_001', 'sub_005'],
        processTemplateIds: ['pt_001', 'pt_007'],
        createdDate: new Date('2024-03-10'),
        lastModified: new Date('2024-12-15'),
        status: 'active'
      },
      {
        id: 'mc_004',
        name: 'Cornerstone Management Solutions',
        type: 'government',
        address: {
          street: '321 Professional Park',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701',
          country: 'United States'
        },
        primaryContact: {
          firstName: 'David',
          lastName: 'Thompson',
          email: 'david.thompson@cornerstonems.com',
          phone: '+1 (555) 456-7890',
          title: 'President'
        },
        branding: {
          primaryColor: '#d32f2f',
          secondaryColor: '#f44336',
          tertiaryColor: '#ffebee',
          useDefaultColors: false
        },
        languageFileId: 'lang_003',
        subscriptionIds: ['sub_003', 'sub_006', 'sub_009'],
        processTemplateIds: ['pt_003', 'pt_008'],
        createdDate: new Date('2024-04-05'),
        lastModified: new Date('2024-12-10'),
        status: 'pending'
      },
      {
        id: 'mc_005',
        name: 'Pinnacle Property Advisors',
        type: 'rental',
        address: {
          street: '654 Commerce Street',
          city: 'Seattle',
          state: 'WA',
          zipCode: '98101',
          country: 'United States'
        },
        primaryContact: {
          firstName: 'Jessica',
          lastName: 'Williams',
          email: 'jessica.williams@pinnaclepa.com',
          phone: '+1 (555) 567-8901',
          title: 'Managing Partner'
        },
        branding: {
          primaryColor: '#7b1fa2',
          secondaryColor: '#9c27b0',
          tertiaryColor: '#f3e5f5',
          useDefaultColors: false
        },
        languageFileId: 'lang_002',
        subscriptionIds: ['sub_002', 'sub_007', 'sub_010'],
        processTemplateIds: ['pt_002', 'pt_009'],
        createdDate: new Date('2024-05-20'),
        lastModified: new Date('2024-12-05'),
        status: 'active'
      }
    ];

    return companies;
  }
}