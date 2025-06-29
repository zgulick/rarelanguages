import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { 
  LanguageFile, 
  LanguageTerm, 
  LanguageTermUpdate,
  LanguageFileSearchResult,
  ApiResponse 
} from '../models';
import { ApiSimulationService } from './api-simulation.service';

@Injectable({
  providedIn: 'root'
})
export class LanguageFileService {
  private languageFiles: LanguageFile[] = this.generateMockLanguageFiles();
  
  constructor(private apiSimulation: ApiSimulationService) {}

  getLanguageFiles(): Observable<ApiResponse<LanguageFile[]>> {
    return this.apiSimulation.simulateApiCall(() => this.languageFiles);
  }

  getLanguageFileById(id: string): Observable<ApiResponse<LanguageFile>> {
    return this.apiSimulation.simulateApiCall(() => {
      const file = this.languageFiles.find(f => f.id === id);
      if (!file) {
        throw new Error(`Language file with ID ${id} not found`);
      }
      return file;
    });
  }

  searchLanguageTerms(fileId: string, searchTerm: string = ''): Observable<ApiResponse<LanguageFileSearchResult>> {
    return this.apiSimulation.simulateApiCall(() => {
      const file = this.languageFiles.find(f => f.id === fileId);
      if (!file) {
        throw new Error(`Language file with ID ${fileId} not found`);
      }

      const allTerms: LanguageTerm[] = Object.entries(file.terms).map(([backendTerm, frontendTerm]) => ({
        backendTerm,
        frontendTerm,
        category: this.categorizeBackendTerm(backendTerm)
      }));

      let filteredTerms = allTerms;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredTerms = allTerms.filter(langTerm => 
          langTerm.backendTerm.toLowerCase().includes(term) ||
          langTerm.frontendTerm.toLowerCase().includes(term)
        );
      }

      return {
        terms: filteredTerms,
        total: allTerms.length,
        filteredCount: filteredTerms.length
      };
    });
  }

  updateLanguageTerms(fileId: string, updates: LanguageTermUpdate[]): Observable<ApiResponse<LanguageFile>> {
    return this.apiSimulation.simulateApiCall(() => {
      const fileIndex = this.languageFiles.findIndex(f => f.id === fileId);
      if (fileIndex === -1) {
        throw new Error(`Language file with ID ${fileId} not found`);
      }

      const file = { ...this.languageFiles[fileIndex] };
      
      // Apply updates
      updates.forEach(update => {
        file.terms[update.backendTerm] = update.newFrontendTerm;
      });

      file.lastModified = new Date();
      file.version = this.incrementVersion(file.version);

      this.languageFiles[fileIndex] = file;
      
      return file;
    });
  }

  resetTermToDefault(fileId: string, backendTerm: string): Observable<ApiResponse<boolean>> {
    return this.apiSimulation.simulateApiCall(() => {
      const fileIndex = this.languageFiles.findIndex(f => f.id === fileId);
      if (fileIndex === -1) {
        throw new Error(`Language file with ID ${fileId} not found`);
      }

      const file = this.languageFiles[fileIndex];
      
      // Reset to a sensible default (capitalize and replace underscores)
      const defaultTerm = backendTerm
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      file.terms[backendTerm] = defaultTerm;
      file.lastModified = new Date();

      return true;
    });
  }

  private categorizeBackendTerm(term: string): string {
    if (term.includes('user') || term.includes('account') || term.includes('profile')) return 'User Management';
    if (term.includes('property') || term.includes('asset') || term.includes('building')) return 'Property Management';
    if (term.includes('payment') || term.includes('invoice') || term.includes('billing')) return 'Financial';
    if (term.includes('maintenance') || term.includes('repair') || term.includes('work_order')) return 'Maintenance';
    if (term.includes('tenant') || term.includes('lease') || term.includes('rental')) return 'Tenant Management';
    return 'General';
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private generateMockLanguageFiles(): LanguageFile[] {
    return [
      {
        id: 'lang_001',
        name: 'Standard English (US)',
        description: 'Default English language file for US property management',
        version: '1.0.5',
        lastModified: new Date('2024-12-15'),
        terms: {
          'user_profile': 'User Profile',
          'account_settings': 'Account Settings',
          'property_management': 'Property Management',
          'tenant_portal': 'Tenant Portal',
          'maintenance_request': 'Maintenance Request',
          'work_order': 'Work Order',
          'payment_history': 'Payment History',
          'lease_agreement': 'Lease Agreement',
          'property_details': 'Property Details',
          'contact_information': 'Contact Information',
          'billing_statement': 'Billing Statement',
          'service_charge': 'Service Charge',
          'monthly_rent': 'Monthly Rent',
          'security_deposit': 'Security Deposit',
          'property_address': 'Property Address',
          'emergency_contact': 'Emergency Contact',
          'lease_renewal': 'Lease Renewal',
          'move_in_date': 'Move-in Date',
          'move_out_date': 'Move-out Date',
          'parking_space': 'Parking Space',
          'amenities_access': 'Amenities Access',
          'utility_bills': 'Utility Bills',
          'inspection_report': 'Inspection Report',
          'damage_assessment': 'Damage Assessment',
          'repair_status': 'Repair Status'
        }
      },
      {
        id: 'lang_002',
        name: 'Professional Real Estate',
        description: 'Formal terminology for commercial real estate management',
        version: '2.1.3',
        lastModified: new Date('2024-12-10'),
        terms: {
          'user_profile': 'Professional Profile',
          'account_settings': 'Account Configuration',
          'property_management': 'Asset Management',
          'tenant_portal': 'Client Portal',
          'maintenance_request': 'Service Request',
          'work_order': 'Service Order',
          'payment_history': 'Transaction History',
          'lease_agreement': 'Occupancy Agreement',
          'property_details': 'Asset Information',
          'contact_information': 'Professional Contacts',
          'billing_statement': 'Financial Statement',
          'service_charge': 'Management Fee',
          'monthly_rent': 'Occupancy Fee',
          'security_deposit': 'Performance Bond',
          'property_address': 'Asset Location',
          'emergency_contact': 'Primary Contact',
          'lease_renewal': 'Contract Extension',
          'move_in_date': 'Occupancy Commencement',
          'move_out_date': 'Occupancy Termination',
          'parking_space': 'Vehicle Assignment',
          'amenities_access': 'Facility Privileges',
          'utility_bills': 'Service Charges',
          'inspection_report': 'Assessment Report',
          'damage_assessment': 'Condition Evaluation',
          'repair_status': 'Service Progress'
        }
      },
      {
        id: 'lang_003',
        name: 'Friendly Residential',
        description: 'Casual, friendly terminology for residential properties',
        version: '1.3.2',
        lastModified: new Date('2024-12-05'),
        terms: {
          'user_profile': 'My Profile',
          'account_settings': 'My Settings',
          'property_management': 'Home Management',
          'tenant_portal': 'Resident Hub',
          'maintenance_request': 'Fix Request',
          'work_order': 'Repair Job',
          'payment_history': 'My Payments',
          'lease_agreement': 'Rental Agreement',
          'property_details': 'Home Info',
          'contact_information': 'My Contacts',
          'billing_statement': 'Monthly Statement',
          'service_charge': 'Service Fee',
          'monthly_rent': 'Monthly Payment',
          'security_deposit': 'Move-in Deposit',
          'property_address': 'Home Address',
          'emergency_contact': 'Emergency Info',
          'lease_renewal': 'Renew Lease',
          'move_in_date': 'Move-in Day',
          'move_out_date': 'Move-out Day',
          'parking_space': 'Parking Spot',
          'amenities_access': 'Community Features',
          'utility_bills': 'Utility Costs',
          'inspection_report': 'Home Checkup',
          'damage_assessment': 'Damage Report',
          'repair_status': 'Fix Progress'
        }
      }
    ];
  }
}