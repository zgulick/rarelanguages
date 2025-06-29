import { Component, OnInit, ChangeDetectionStrategy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, BehaviorSubject, debounceTime, distinctUntilChanged, map, combineLatest, startWith } from 'rxjs';

import { ManagementCompanyService } from '../../../../core/services';
import { ManagementCompanyListItem, ManagementCompany } from '../../../../core/models';

@Component({
  selector: 'app-management-company-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="management-company-list">
      <!-- Filter Sidebar -->
      <div class="filter-sidebar">
        <div class="sidebar-section">
          <div class="sidebar-title">Filters</div>
          <button class="btn btn-link btn-sm reset-filters" (click)="resetFilters()">Reset Filters</button>
        </div>
        
        <div class="sidebar-section">
          <div class="filter-group">
            <div class="filter-title">Status</div>
            <div class="form-check" *ngFor="let status of statusOptions">
              <input 
                class="form-check-input" 
                type="checkbox" 
                [id]="'status-' + status.value"
                [checked]="selectedStatuses.includes(status.value)"
                (change)="toggleStatusFilter(status.value)">
              <label class="form-check-label" [for]="'status-' + status.value">
                {{ status.label }}
              </label>
            </div>
          </div>
        </div>
        
        <div class="sidebar-section">
          <div class="filter-group">
            <div class="filter-title">Type</div>
            <div class="form-check" *ngFor="let type of typeOptions">
              <input 
                class="form-check-input" 
                type="checkbox" 
                [id]="'type-' + type.value"
                [checked]="selectedTypes.includes(type.value)"
                (change)="toggleTypeFilter(type.value)">
              <label class="form-check-label" [for]="'type-' + type.value">
                {{ type.label }}
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="list-content">
        <!-- Search and Actions Bar -->
        <div class="list-header">
        <div class="search-section">
          <div class="dropdown">
            <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
              <mat-icon>email</mat-icon>
              Email
            </button>
          </div>
          
          <div class="search-input-wrapper">
            <input 
              type="text" 
              class="form-control" 
              placeholder="Search companies"
              [value]="searchTerm"
              (input)="onSearchChange($event)">
            <button class="btn search-btn" type="button">
              <mat-icon>search</mat-icon>
            </button>
          </div>
        </div>
        
        <div class="actions-section">
          <div class="results-info">
            {{ (filteredCompanies$ | async)?.length || 0 }} Companies
          </div>
          <button class="btn btn-primary" (click)="createNewCompany()">
            <mat-icon>add</mat-icon>
            Add Company
          </button>
          <div class="view-controls">
            <button class="btn" 
                    [class.btn-primary]="currentView === 'grid'"
                    [class.btn-outline-secondary]="currentView !== 'grid'"
                    matTooltip="Grid View"
                    (click)="setGridView()">
              <mat-icon>grid_view</mat-icon>
            </button>
            <button class="btn"
                    [class.btn-primary]="currentView === 'list'"
                    [class.btn-outline-secondary]="currentView !== 'list'"
                    matTooltip="List View"
                    (click)="setListView()">
              <mat-icon>view_list</mat-icon>
            </button>
          </div>
        </div>
      </div>

      <!-- Companies Display -->
      <div class="companies-display" *ngIf="!isLoading; else loadingTemplate">
        
        <!-- Grid View -->
        <div class="companies-grid" *ngIf="currentView === 'grid'">
          <div class="grid-container">
            <div 
              class="company-card" 
              *ngFor="let company of (filteredCompanies$ | async)"
              (click)="editCompany(company.id)">
              
              <div class="card-header">
                <div class="company-avatar">
                  <mat-icon>business</mat-icon>
                </div>
                <div class="company-info">
                  <div class="company-name">{{ company.name }}</div>
                  <div class="company-email">{{ company.primaryContactEmail }}</div>
                  <div class="company-phone">{{ company.primaryContactName }}</div>
                </div>
              </div>
              
              <div class="card-footer">
                <div class="status-section">
                  <span class="status-badge" [class.active]="company.status === 'active'">
                    {{ company.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div class="companies-list" *ngIf="currentView === 'list'">
          <div class="list-container">
            <div class="list-header">
              <div class="header-cell company-name-header">Company</div>
              <div class="header-cell contact-header">Primary Contact</div>
              <div class="header-cell type-header">Type</div>
              <div class="header-cell status-header">Status</div>
              <div class="header-cell date-header">Last Modified</div>
              <div class="header-cell actions-header">Actions</div>
            </div>
            
            <div 
              class="list-row" 
              *ngFor="let company of (filteredCompanies$ | async)"
              (click)="editCompany(company.id)">
              
              <div class="list-cell company-name-cell">
                <div class="company-avatar-small">
                  <mat-icon>business</mat-icon>
                </div>
                <div class="company-details">
                  <div class="company-name">{{ company.name }}</div>
                  <div class="company-id">{{ company.id }}</div>
                </div>
              </div>
              
              <div class="list-cell contact-cell">
                <div class="contact-name">{{ company.primaryContactName }}</div>
                <div class="contact-email">{{ company.primaryContactEmail }}</div>
              </div>
              
              <div class="list-cell type-cell">
                <span class="type-badge">{{ company.type | titlecase }}</span>
              </div>
              
              <div class="list-cell status-cell">
                <span class="status-badge" [class.active]="company.status === 'active'">
                  {{ company.status }}
                </span>
              </div>
              
              <div class="list-cell date-cell">
                {{ company.lastModified | date:'shortDate' }}
              </div>
              
              <div class="list-cell actions-cell">
                <button class="btn btn-sm btn-outline-secondary" (click)="editCompany(company.id); $event.stopPropagation()">
                  <mat-icon>edit</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="(filteredCompanies$ | async)?.length === 0">
          <mat-icon class="empty-icon">business</mat-icon>
          <h3>No companies found</h3>
          <p>{{ searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first management company' }}</p>
          <button 
            class="btn btn-primary"
            (click)="createNewCompany()">
            <mat-icon>add</mat-icon>
            Create New Company
          </button>
        </div>
      </div>

      <!-- Loading Template -->
      <ng-template #loadingTemplate>
        <div class="loading-container">
          <mat-progress-spinner diameter="40" mode="indeterminate"></mat-progress-spinner>
          <p>Loading management companies...</p>
        </div>
      </ng-template>
    </div>

    <!-- Side Panel -->
    <div class="side-panel-backdrop" [class.show]="showSidePanel" (click)="closeSidePanel()"></div>
    <div class="side-panel" [class.open]="showSidePanel">
      <div class="panel-header">
        <div class="panel-title">Edit Company - {{ selectedCompany?.name }}</div>
        <button class="close-btn" (click)="closeSidePanel()">×</button>
      </div>
      
      <div class="panel-tabs">
        <ul class="nav nav-tabs">
          <li class="nav-item">
            <a class="nav-link" [class.active]="activePanelTab === 'company'" 
               (click)="setActivePanelTab('company', $event)">
               <mat-icon>business</mat-icon>
               Company
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activePanelTab === 'contact'" 
               (click)="setActivePanelTab('contact', $event)">
               <mat-icon>person</mat-icon>
               Contact
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activePanelTab === 'branding'" 
               (click)="setActivePanelTab('branding', $event)">
               <mat-icon>palette</mat-icon>
               Branding
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activePanelTab === 'language'" 
               (click)="setActivePanelTab('language', $event)">
               <mat-icon>language</mat-icon>
               Language
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activePanelTab === 'subscriptions'" 
               (click)="setActivePanelTab('subscriptions', $event)">
               <mat-icon>subscriptions</mat-icon>
               Subscriptions
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" [class.active]="activePanelTab === 'templates'" 
               (click)="setActivePanelTab('templates', $event)">
               <mat-icon>description</mat-icon>
               Templates
            </a>
          </li>
        </ul>
      </div>
      
      <div class="panel-content">
        <form [formGroup]="editForm">
          <!-- Company Details Tab -->
          <div *ngIf="activePanelTab === 'company'">
            <div class="tab-content-section">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Company Name <span class="required">*</span></label>
                  <input type="text" class="form-control" formControlName="name" placeholder="Enter a company name">
                  <div class="text-danger small mt-1" *ngIf="editForm.get('name')?.hasError('required') && editForm.get('name')?.touched">
                    This field is required
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Type <span class="required">*</span></label>
                  <select class="form-control" formControlName="type">
                    <option value="preservation">Preservation Services</option>
                    <option value="mortgage">Mortgage Servicing</option>
                    <option value="rental">Rental Management</option>
                    <option value="government">Government Entity</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Active</label>
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" formControlName="active" id="activeCheck">
                    <label class="form-check-label" for="activeCheck"></label>
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group full-width">
                  <label class="form-label">Street Address <span class="required">*</span></label>
                  <input type="text" class="form-control" formControlName="street" placeholder="Enter street address">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">City <span class="required">*</span></label>
                  <input type="text" class="form-control" formControlName="city" placeholder="Enter city">
                </div>
                <div class="form-group">
                  <label class="form-label">State <span class="required">*</span></label>
                  <select class="form-control" formControlName="state">
                    <option value="">Select state</option>
                    <option value="NY">New York</option>
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="IL">Illinois</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">ZIP Code <span class="required">*</span></label>
                  <input type="text" class="form-control" formControlName="zipCode" placeholder="Enter ZIP code">
                </div>
              </div>
            </div>
          </div>

          <!-- Contact Details Tab -->
          <div *ngIf="activePanelTab === 'contact'">
            <div class="tab-content-section">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">First Name <span class="required">*</span></label>
                  <input type="text" class="form-control" formControlName="contactFirstName" placeholder="Enter first name">
                </div>
                <div class="form-group">
                  <label class="form-label">Last Name <span class="required">*</span></label>
                  <input type="text" class="form-control" formControlName="contactLastName" placeholder="Enter last name">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Email <span class="required">*</span></label>
                  <div class="input-group">
                    <span class="input-group-text">
                      <mat-icon>email</mat-icon>
                    </span>
                    <input type="email" class="form-control" formControlName="contactEmail" placeholder="Enter the email of the contact">
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">Phone <span class="required">*</span></label>
                  <input type="text" class="form-control" formControlName="contactPhone" placeholder="Enter phone number">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group full-width">
                  <label class="form-label">Title <span class="required">*</span></label>
                  <input type="text" class="form-control" formControlName="contactTitle" placeholder="Enter job title">
                </div>
              </div>
            </div>
          </div>

          <!-- Branding Tab -->
          <div *ngIf="activePanelTab === 'branding'">
            <div class="tab-content-section">
              <div class="form-row">
                <div class="form-group">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" formControlName="useDefaultColors" id="defaultColorsCheck">
                    <label class="form-check-label" for="defaultColorsCheck">
                      Use default color scheme
                    </label>
                  </div>
                </div>
              </div>
              
              <div class="form-row" *ngIf="!editForm.get('useDefaultColors')?.value">
                <div class="form-group">
                  <label class="form-label">Primary Color</label>
                  <input type="color" class="form-control color-input" formControlName="primaryColor">
                </div>
                <div class="form-group">
                  <label class="form-label">Secondary Color</label>
                  <input type="color" class="form-control color-input" formControlName="secondaryColor">
                </div>
                <div class="form-group">
                  <label class="form-label">Tertiary Color</label>
                  <input type="color" class="form-control color-input" formControlName="tertiaryColor">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group full-width">
                  <label class="form-label">Logo Upload</label>
                  <div class="file-upload-area">
                    <input type="file" class="form-control" accept=".svg">
                    <p class="text-muted small">Upload SVG file for company logo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Language Tab -->
          <div *ngIf="activePanelTab === 'language'">
            <div class="tab-content-section">
              <div class="form-row">
                <div class="form-group language-dropdown">
                  <label class="form-label">Language File</label>
                  <select class="form-control" formControlName="languageFileId">
                    <option value="">Select a language file</option>
                    <option value="lang_001">English (US) - Default</option>
                    <option value="lang_002">English (UK) - British</option>
                    <option value="lang_003">Spanish (ES) - Spain</option>
                  </select>
                </div>
              </div>
              
              <div class="language-terms-section" *ngIf="editForm.get('languageFileId')?.value">
                <h5>Term Customization</h5>
                <div class="search-terms">
                  <input type="text" class="form-control" placeholder="Search backend terms..." [(ngModel)]="termSearchQuery">
                </div>
                <div class="terms-grid-compact">
                  <div class="terms-header">
                    <div>Backend Term</div>
                    <div>Frontend Term</div>
                  </div>
                  <div class="term-row" *ngFor="let term of filteredTerms">
                    <div>{{ term.backendTerm }}</div>
                    <div>
                      <input type="text" class="form-control" [(ngModel)]="term.frontendTerm">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Subscriptions Tab -->
          <div *ngIf="activePanelTab === 'subscriptions'">
            <div class="tab-content-section">
              <div class="subscriptions-controls">
                <input type="text" class="form-control search-subscriptions" placeholder="Search subscriptions..." [(ngModel)]="subscriptionSearchQuery">
                <div class="select-actions">
                  <button type="button" class="btn btn-sm btn-outline-primary" (click)="selectAllSubscriptions()">Select All</button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" (click)="selectNoneSubscriptions()">Select None</button>
                </div>
              </div>
              
              <div class="subscriptions-grid-compact">
                <div class="subscription-header">
                  <div>Select</div>
                  <div>Name</div>
                  <div>Category</div>
                </div>
                <div class="subscription-row" *ngFor="let subscription of filteredSubscriptions">
                  <div>
                    <input type="checkbox" class="form-check-input" 
                           [checked]="selectedSubscriptionIds.includes(subscription.id)"
                           (change)="toggleSubscription(subscription.id)">
                  </div>
                  <div>{{ subscription.name }}</div>
                  <div>{{ subscription.category }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Process Templates Tab -->
          <div *ngIf="activePanelTab === 'templates'">
            <div class="tab-content-section">
              <div class="templates-controls">
                <input type="text" class="form-control search-templates" placeholder="Search process templates..." [(ngModel)]="templateSearchQuery">
                <div class="pagination-info">
                  Page {{ currentTemplatePage }} of {{ totalTemplatePages }}
                </div>
              </div>
              
              <div class="templates-grid-compact">
                <div class="template-header">
                  <div>Select</div>
                  <div>Name</div>
                  <div>Version</div>
                </div>
                <div class="template-row" *ngFor="let template of paginatedTemplates">
                  <div>
                    <input type="checkbox" class="form-check-input" 
                           [checked]="selectedTemplateIds.includes(template.id)"
                           (change)="toggleTemplate(template.id)">
                  </div>
                  <div>{{ template.name }}</div>
                  <div>{{ template.version }}</div>
                </div>
              </div>
              
              <div class="pagination-controls">
                <button type="button" class="btn btn-sm btn-outline-secondary" 
                        [disabled]="currentTemplatePage === 1" (click)="previousTemplatePage()">Previous</button>
                <span>{{ currentTemplatePage }} of {{ totalTemplatePages }}</span>
                <button type="button" class="btn btn-sm btn-outline-secondary" 
                        [disabled]="currentTemplatePage === totalTemplatePages" (click)="nextTemplatePage()">Next</button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="panel-footer">
        <button class="btn btn-secondary me-2" (click)="closeSidePanel()">Cancel</button>
        <button class="btn btn-primary">Save Changes</button>
      </div>
    </div>
      
      <!-- Success Toaster -->
      <div class="success-toaster" [class.show]="showSuccessToaster">
        <div class="toaster-content">
          <mat-icon>check_circle</mat-icon>
          <span>Success! Your Management Company has been created!</span>
        </div>
      </div>
      </div> <!-- end list-content -->
  `,
  styleUrls: ['./management-company-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagementCompanyListComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private managementCompanyService = inject(ManagementCompanyService);
  private cdr = inject(ChangeDetectorRef);
  private fb = inject(FormBuilder);
  
  // Success toaster state
  showSuccessToaster = false;
  
  // Edit form
  editForm: FormGroup;

  displayedColumns: string[] = ['name', 'primaryContact', 'status', 'createdDate', 'lastModified', 'actions'];
  
  filteredCompanies$: Observable<ManagementCompanyListItem[]>;
  searchTerm = '';
  isLoading = false;

  // Side panel state
  showSidePanel = false;
  selectedCompany: ManagementCompanyListItem | null = null;
  activePanelTab = 'company';
  
  // View state
  currentView: 'grid' | 'list' = 'grid';
  
  // Section expansion states for edit panel
  contactDetailsExpanded = true;
  brandingExpanded = false;
  languageExpanded = false;
  subscriptionsExpanded = false;
  processTemplatesExpanded = false;
  
  // Language customization
  termSearchQuery = '';
  availableTerms = [
    { backendTerm: 'property', frontendTerm: 'Property' },
    { backendTerm: 'tenant', frontendTerm: 'Tenant' },
    { backendTerm: 'lease', frontendTerm: 'Lease Agreement' },
    { backendTerm: 'maintenance', frontendTerm: 'Maintenance Request' }
  ];

  // Subscriptions
  subscriptionSearchQuery = '';
  selectedSubscriptionIds: string[] = [];
  availableSubscriptions = [
    { id: 'sub_001', name: 'Property Management', description: 'Full property management services', category: 'Core' },
    { id: 'sub_002', name: 'Tenant Screening', description: 'Background check services', category: 'Services' },
    { id: 'sub_003', name: 'Maintenance Coordination', description: 'Maintenance request handling', category: 'Services' },
    { id: 'sub_004', name: 'Financial Reporting', description: 'Monthly financial reports', category: 'Reporting' }
  ];

  // Process Templates
  templateSearchQuery = '';
  selectedTemplateIds: string[] = [];
  currentTemplatePage = 1;
  templatesPerPage = 25;
  totalTemplates = 200;
  totalTemplatePages = 8;
  availableTemplates = [
    { id: 'pt_001', name: 'Property Inspection', version: '1.2', statusDate: new Date(), managementCompany: 'Default' },
    { id: 'pt_002', name: 'Tenant Move-in', version: '2.1', statusDate: new Date(), managementCompany: 'Default' },
    { id: 'pt_003', name: 'Maintenance Request', version: '1.5', statusDate: new Date(), managementCompany: 'Default' }
  ];

  // Filter state
  statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' }
  ];
  
  typeOptions = [
    { value: 'preservation', label: 'Preservation Services' },
    { value: 'mortgage', label: 'Mortgage Servicing' },
    { value: 'rental', label: 'Rental Management' },
    { value: 'government', label: 'Government Entity' }
  ];
  
  selectedStatuses: string[] = [];
  selectedTypes: string[] = [];

  private searchSubject = new BehaviorSubject<string>('');
  private filtersSubject = new BehaviorSubject<{statuses: string[], types: string[]}>({statuses: [], types: []});

  constructor() {
    // Initialize edit form
    this.editForm = this.createEditForm();
    
    // Create reactive filtered companies observable
    const allCompanies$ = this.managementCompanyService.companies$.pipe(
      map(companies => {
        this.isLoading = false;
        this.cdr.detectChanges();
        return companies.map((company: ManagementCompany) => ({
          id: company.id!,
          name: company.name,
          type: company.type,
          primaryContactName: `${company.primaryContact.firstName} ${company.primaryContact.lastName}`,
          primaryContactEmail: company.primaryContact.email,
          status: company.status,
          createdDate: company.createdDate!,
          lastModified: company.lastModified!
        }));
      })
    );

    // Combine companies with search and filter changes
    this.filteredCompanies$ = combineLatest([
      allCompanies$,
      this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()),
      this.filtersSubject
    ]).pipe(
      map(([companies, searchTerm, filters]) => {
        let filtered = companies;

        // Apply search filter
        if (searchTerm.trim()) {
          const search = searchTerm.toLowerCase().trim();
          filtered = filtered.filter(company => 
            company.name.toLowerCase().includes(search) ||
            company.primaryContactName.toLowerCase().includes(search) ||
            company.primaryContactEmail.toLowerCase().includes(search) ||
            company.type.toLowerCase().includes(search)
          );
        }

        // Apply status filters
        if (filters.statuses.length > 0) {
          filtered = filtered.filter(company => filters.statuses.includes(company.status));
        }

        // Apply type filters
        if (filters.types.length > 0) {
          filtered = filtered.filter(company => filters.types.includes(company.type));
        }

        return filtered;
      })
    );
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.checkForSuccessMessage();
    // Initialize filters
    this.applyFilters();
  }
  
  private checkForSuccessMessage(): void {
    this.route.queryParams.subscribe(params => {
      if (params['success'] === 'true' && params['created']) {
        // Show success toaster
        this.showSuccessToaster = true;
        this.cdr.detectChanges();
        
        // Hide toaster after 3 seconds
        setTimeout(() => {
          this.showSuccessToaster = false;
          this.cdr.detectChanges();
        }, 3000);
        
        // Clean up URL by removing query params
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true
        });
      }
    });
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm = target.value;
    this.searchSubject.next(this.searchTerm);
  }

  createNewCompany(): void {
    this.router.navigate(['/management-companies/create']);
  }

  setGridView(): void {
    this.currentView = 'grid';
  }

  setListView(): void {
    this.currentView = 'list';
  }

  editCompany(companyId: string): void {
    // Get the full company details from the service
    this.managementCompanyService.getManagementCompanyById(companyId).subscribe({
      next: (response) => {
        const company = response.data;
        
        // Set the selected company for the list item view
        this.selectedCompany = {
          id: company.id!,
          name: company.name,
          type: company.type,
          primaryContactName: `${company.primaryContact.firstName} ${company.primaryContact.lastName}`,
          primaryContactEmail: company.primaryContact.email,
          status: company.status,
          createdDate: company.createdDate!,
          lastModified: company.lastModified!
        };
        
        // Populate the edit form with company data
        this.editForm.patchValue({
          name: company.name,
          type: company.type,
          active: company.status === 'active',
          street: company.address.street,
          city: company.address.city,
          state: company.address.state,
          zipCode: company.address.zipCode,
          contactFirstName: company.primaryContact.firstName,
          contactLastName: company.primaryContact.lastName,
          contactEmail: company.primaryContact.email,
          contactPhone: company.primaryContact.phone,
          contactTitle: company.primaryContact.title,
          useDefaultColors: company.branding?.useDefaultColors || true,
          primaryColor: company.branding?.primaryColor || '#6b8e23',
          secondaryColor: company.branding?.secondaryColor || '#556b2f',
          tertiaryColor: company.branding?.tertiaryColor || '#f5f5f5',
          languageFileId: company.languageFileId || ''
        });
        
        // Set selected subscriptions and templates
        this.selectedSubscriptionIds = company.subscriptionIds || [];
        this.selectedTemplateIds = company.processTemplateIds || [];
        
        // Show the side panel
        this.showSidePanel = true;
        this.activePanelTab = 'company';
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading company details:', error);
      }
    });
  }

  viewCompany(companyId: string): void {
    this.editCompany(companyId);
  }

  closeSidePanel(): void {
    this.showSidePanel = false;
    this.selectedCompany = null;
  }

  setActivePanelTab(tab: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.activePanelTab = tab;
  }

  private createEditForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required]],
      type: ['rental', [Validators.required]],
      active: [true],
      street: ['', [Validators.required]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      zipCode: ['', [Validators.required]],
      contactFirstName: ['', [Validators.required]],
      contactLastName: ['', [Validators.required]],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', [Validators.required]],
      contactTitle: ['', [Validators.required]],
      useDefaultColors: [true],
      primaryColor: ['#6b8e23'],
      secondaryColor: ['#556b2f'],
      tertiaryColor: ['#f5f5f5'],
      languageFileId: ['']
    });
  }

  // Toggle methods for edit panel sections
  toggleContactDetails(): void {
    this.contactDetailsExpanded = !this.contactDetailsExpanded;
  }

  toggleBranding(): void {
    this.brandingExpanded = !this.brandingExpanded;
  }

  toggleLanguage(): void {
    this.languageExpanded = !this.languageExpanded;
  }

  toggleSubscriptions(): void {
    this.subscriptionsExpanded = !this.subscriptionsExpanded;
  }

  toggleProcessTemplates(): void {
    this.processTemplatesExpanded = !this.processTemplatesExpanded;
  }

  // Language customization methods
  get filteredTerms() {
    if (!this.termSearchQuery) {
      return this.availableTerms;
    }
    return this.availableTerms.filter(term => 
      term.backendTerm.toLowerCase().includes(this.termSearchQuery.toLowerCase()) ||
      term.frontendTerm.toLowerCase().includes(this.termSearchQuery.toLowerCase())
    );
  }

  // Subscription methods
  get filteredSubscriptions() {
    if (!this.subscriptionSearchQuery) {
      return this.availableSubscriptions;
    }
    return this.availableSubscriptions.filter(sub => 
      sub.name.toLowerCase().includes(this.subscriptionSearchQuery.toLowerCase()) ||
      sub.description.toLowerCase().includes(this.subscriptionSearchQuery.toLowerCase())
    );
  }

  toggleSubscription(id: string): void {
    if (this.selectedSubscriptionIds.includes(id)) {
      this.selectedSubscriptionIds = this.selectedSubscriptionIds.filter(subId => subId !== id);
    } else {
      this.selectedSubscriptionIds.push(id);
    }
  }

  selectAllSubscriptions(): void {
    this.selectedSubscriptionIds = this.filteredSubscriptions.map(sub => sub.id);
  }

  selectNoneSubscriptions(): void {
    this.selectedSubscriptionIds = [];
  }

  // Process Template methods
  get paginatedTemplates() {
    const start = (this.currentTemplatePage - 1) * this.templatesPerPage;
    return this.availableTemplates.slice(start, start + this.templatesPerPage);
  }

  toggleTemplate(id: string): void {
    if (this.selectedTemplateIds.includes(id)) {
      this.selectedTemplateIds = this.selectedTemplateIds.filter(templateId => templateId !== id);
    } else {
      this.selectedTemplateIds.push(id);
    }
  }

  previousTemplatePage(): void {
    if (this.currentTemplatePage > 1) {
      this.currentTemplatePage--;
    }
  }

  nextTemplatePage(): void {
    if (this.currentTemplatePage < this.totalTemplatePages) {
      this.currentTemplatePage++;
    }
  }

  // Filter methods
  toggleStatusFilter(status: string): void {
    if (this.selectedStatuses.includes(status)) {
      this.selectedStatuses = this.selectedStatuses.filter(s => s !== status);
    } else {
      this.selectedStatuses.push(status);
    }
    this.applyFilters();
  }

  toggleTypeFilter(type: string): void {
    if (this.selectedTypes.includes(type)) {
      this.selectedTypes = this.selectedTypes.filter(t => t !== type);
    } else {
      this.selectedTypes.push(type);
    }
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedStatuses = [];
    this.selectedTypes = [];
    this.applyFilters();
  }

  private applyFilters(): void {
    // Trigger filter changes
    this.filtersSubject.next({
      statuses: [...this.selectedStatuses],
      types: [...this.selectedTypes]
    });
    this.cdr.detectChanges();
  }
}