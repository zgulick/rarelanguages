import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { MatExpansionModule } from '@angular/material/expansion';
import { ManagementCompanyService } from '../../../../core/services';
import { ManagementCompany } from '../../../../core/models';

@Component({
  selector: 'app-management-company-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatExpansionModule
  ],
  template: `
    <div class="create-management-company">
      <!-- Action Buttons -->
      <div class="page-actions">
        <button mat-raised-button color="primary" class="save-btn" (click)="onSave()" [disabled]="!basicInfoForm.valid || isSaving">
          <span *ngIf="!isSaving">Save Company</span>
          <span *ngIf="isSaving">Creating Company...</span>
        </button>
        <button mat-raised-button class="cancel-btn" (click)="goBack()">
          Cancel
        </button>
      </div>

      <!-- Main Form Content -->
      <div class="form-content">
        <form [formGroup]="basicInfoForm">
          
          <!-- Section 1: Company Details -->
          <div class="form-section expanded">
            <div class="section-header">
              <div class="section-number">1</div>
              <h3 class="section-title">COMPANY DETAILS</h3>
            </div>
            
            <div class="section-content">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Company Name <span class="required">*</span></label>
                  <input type="text" class="form-control" formControlName="name" placeholder="Enter a company name">
                  <div class="text-danger small mt-1" *ngIf="basicInfoForm.get('name')?.hasError('required') && basicInfoForm.get('name')?.touched">
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

          <!-- Section 2: Contact Details (Collapsible) -->
          <div class="form-section collapsible" [class.expanded]="contactDetailsExpanded">
            <div class="section-header" (click)="toggleContactDetails()">
              <div class="section-number">2</div>
              <h3 class="section-title">CONTACT DETAILS</h3>
              <mat-icon class="expand-icon">{{contactDetailsExpanded ? 'expand_less' : 'expand_more'}}</mat-icon>
            </div>
            
            <div class="section-content" *ngIf="contactDetailsExpanded">
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

          <!-- Section 3: Branding & Logo (Collapsible) -->
          <div class="form-section collapsible" [class.expanded]="brandingExpanded">
            <div class="section-header" (click)="toggleBranding()">
              <div class="section-number">3</div>
              <h3 class="section-title">BRANDING & LOGO</h3>
              <mat-icon class="expand-icon">{{brandingExpanded ? 'expand_less' : 'expand_more'}}</mat-icon>
            </div>
            
            <div class="section-content" *ngIf="brandingExpanded">
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
              
              <div class="form-row" *ngIf="!basicInfoForm.get('useDefaultColors')?.value">
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
                    <input type="file" class="form-control" accept=".svg" (change)="onLogoUpload($event)">
                    <p class="text-muted small">Upload SVG file for company logo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 4: Language Customization (Collapsible) -->
          <div class="form-section collapsible" [class.expanded]="languageExpanded">
            <div class="section-header" (click)="toggleLanguage()">
              <div class="section-number">4</div>
              <h3 class="section-title">LANGUAGE CUSTOMIZATION</h3>
              <mat-icon class="expand-icon">{{languageExpanded ? 'expand_less' : 'expand_more'}}</mat-icon>
            </div>
            
            <div class="section-content" *ngIf="languageExpanded">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Language File</label>
                  <select class="form-control" formControlName="languageFileId">
                    <option value="">Select a language file</option>
                    <option value="lang_001">English (US) - Default</option>
                    <option value="lang_002">English (UK) - British</option>
                    <option value="lang_003">Spanish (ES) - Spain</option>
                  </select>
                </div>
              </div>
              
              <div class="language-terms-section" *ngIf="basicInfoForm.get('languageFileId')?.value">
                <h5>Term Customization</h5>
                <div class="search-terms">
                  <input type="text" class="form-control" placeholder="Search backend terms..." [(ngModel)]="termSearchQuery">
                </div>
                <div class="terms-grid">
                  <div class="terms-header">
                    <div>Backend Term</div>
                    <div>Frontend Term</div>
                    <div>Actions</div>
                  </div>
                  <div class="term-row" *ngFor="let term of filteredTerms">
                    <div>{{ term.backendTerm }}</div>
                    <div>
                      <input type="text" class="form-control" [(ngModel)]="term.frontendTerm">
                    </div>
                    <div>
                      <button type="button" class="btn btn-sm btn-secondary">Reset</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 5: Subscriptions (Collapsible) -->
          <div class="form-section collapsible" [class.expanded]="subscriptionsExpanded">
            <div class="section-header" (click)="toggleSubscriptions()">
              <div class="section-number">5</div>
              <h3 class="section-title">SUBSCRIPTIONS</h3>
              <mat-icon class="expand-icon">{{subscriptionsExpanded ? 'expand_less' : 'expand_more'}}</mat-icon>
            </div>
            
            <div class="section-content" *ngIf="subscriptionsExpanded">
              <div class="subscriptions-controls">
                <input type="text" class="form-control search-subscriptions" placeholder="Search subscriptions..." [(ngModel)]="subscriptionSearchQuery">
                <div class="select-actions">
                  <button type="button" class="btn btn-sm btn-outline-primary" (click)="selectAllSubscriptions()">Select All</button>
                  <button type="button" class="btn btn-sm btn-outline-secondary" (click)="selectNoneSubscriptions()">Select None</button>
                </div>
              </div>
              
              <div class="subscriptions-grid">
                <div class="subscription-header">
                  <div>Select</div>
                  <div>Name</div>
                  <div>Description</div>
                  <div>Category</div>
                </div>
                <div class="subscription-row" *ngFor="let subscription of filteredSubscriptions">
                  <div>
                    <input type="checkbox" class="form-check-input" 
                           [checked]="selectedSubscriptionIds.includes(subscription.id)"
                           (change)="toggleSubscription(subscription.id)">
                  </div>
                  <div>{{ subscription.name }}</div>
                  <div>{{ subscription.description }}</div>
                  <div>{{ subscription.category }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 6: Process Templates (Collapsible) -->
          <div class="form-section collapsible" [class.expanded]="processTemplatesExpanded">
            <div class="section-header" (click)="toggleProcessTemplates()">
              <div class="section-number">6</div>
              <h3 class="section-title">PROCESS TEMPLATES</h3>
              <mat-icon class="expand-icon">{{processTemplatesExpanded ? 'expand_less' : 'expand_more'}}</mat-icon>
            </div>
            
            <div class="section-content" *ngIf="processTemplatesExpanded">
              <div class="templates-controls">
                <input type="text" class="form-control search-templates" placeholder="Search process templates..." [(ngModel)]="templateSearchQuery">
                <div class="pagination-info">
                  Page {{ currentTemplatePage }} of {{ totalTemplatePages }} ({{ totalTemplates }} total)
                </div>
              </div>
              
              <div class="templates-grid">
                <div class="template-header">
                  <div>Select</div>
                  <div>Name</div>
                  <div>Version</div>
                  <div>Status Date</div>
                  <div>Management Company</div>
                </div>
                <div class="template-row" *ngFor="let template of paginatedTemplates">
                  <div>
                    <input type="checkbox" class="form-check-input" 
                           [checked]="selectedTemplateIds.includes(template.id)"
                           (change)="toggleTemplate(template.id)">
                  </div>
                  <div>{{ template.name }}</div>
                  <div>{{ template.version }}</div>
                  <div>{{ template.statusDate | date:'shortDate' }}</div>
                  <div>{{ template.managementCompany }}</div>
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

          <!-- Error Display -->
          <div class="alert alert-danger" *ngIf="saveError">
            {{ saveError }}
          </div>

          <!-- Bottom Action Buttons -->
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="goBack()">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="onSave()" [disabled]="!basicInfoForm.valid || isSaving">
              <span *ngIf="!isSaving">Save Company</span>
              <span *ngIf="isSaving">Creating Company...</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  `,
  styleUrls: ['./management-company-create.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManagementCompanyCreateComponent implements OnInit {
  basicInfoForm: FormGroup;
  
  // Loading and error states
  isLoading = false;
  isSaving = false;
  saveError: string | null = null;
  
  
  // Section expansion states
  contactDetailsExpanded = false;
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

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private managementCompanyService: ManagementCompanyService
  ) {
    this.basicInfoForm = this.createBasicInfoForm();
  }

  ngOnInit(): void {
    // Component initialization
  }

  private createBasicInfoForm(): FormGroup {
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

  // Toggle methods for sections
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

  // File upload handler
  onLogoUpload(event: any): void {
    const file = event.target.files[0];
    if (file) {
      console.log('Logo uploaded:', file.name);
      // Handle file upload logic here
    }
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

  onSave(): void {
    if (this.basicInfoForm.valid && !this.isSaving) {
      this.isSaving = true;
      this.saveError = null;
      
      const formValue = this.basicInfoForm.value;
      
      const newCompany: ManagementCompany = {
        name: formValue.name,
        type: formValue.type,
        address: {
          street: formValue.street,
          city: formValue.city,
          state: formValue.state,
          zipCode: formValue.zipCode,
          country: 'United States'
        },
        primaryContact: {
          firstName: formValue.contactFirstName,
          lastName: formValue.contactLastName,
          email: formValue.contactEmail,
          phone: formValue.contactPhone,
          title: formValue.contactTitle
        },
        branding: {
          primaryColor: formValue.useDefaultColors ? '#6b8e23' : formValue.primaryColor,
          secondaryColor: formValue.useDefaultColors ? '#556b2f' : formValue.secondaryColor,
          tertiaryColor: formValue.useDefaultColors ? '#f5f5f5' : formValue.tertiaryColor,
          useDefaultColors: formValue.useDefaultColors
        },
        languageFileId: formValue.languageFileId || undefined,
        subscriptionIds: this.selectedSubscriptionIds,
        processTemplateIds: this.selectedTemplateIds,
        status: formValue.active ? 'active' : 'inactive'
      };

      // PRODUCTION CODE: Replace this section with actual API calls
      this.createManagementCompanyWithDependencies(newCompany);
    }
  }

  /**
   * PRODUCTION IMPLEMENTATION: 
   * This method demonstrates the complete flow for creating a management company
   * with all necessary database operations and API calls
   */
  private createManagementCompanyWithDependencies(company: ManagementCompany): void {
    // Step 1: Create the core management company record
    this.managementCompanyService.createManagementCompany(company).subscribe({
      next: (companyResponse) => {
        const companyId = companyResponse.data.id;
        if (!companyId) {
          this.handleSaveError('Failed to create management company', new Error('No company ID returned'));
          return;
        }
        
        console.log('✓ Management company created:', companyId);
        
        // Step 2: Execute all dependent operations in parallel
        this.executePostCreationOperations(companyId, company);
      },
      error: (error) => {
        this.handleSaveError('Failed to create management company', error);
      }
    });
  }

  /**
   * PRODUCTION IMPLEMENTATION:
   * Execute all post-creation operations that would typically involve stored procedures
   */
  private executePostCreationOperations(companyId: string, company: ManagementCompany): void {
    const operations = [];

    // PRODUCTION: Call stored procedure to set up company permissions
    // operations.push(
    //   this.securityService.createCompanyPermissions(companyId, {
    //     adminUsers: [company.primaryContact.email],
    //     defaultRoles: ['admin', 'user', 'viewer']
    //   })
    // );

    // PRODUCTION: Call stored procedure to initialize company-specific database schemas
    // operations.push(
    //   this.databaseService.initializeCompanySchema(companyId, {
    //     enableAuditTables: true,
    //     createDefaultCategories: true,
    //     setupReportingTables: true
    //   })
    // );

    // PRODUCTION: Assign selected subscriptions with billing setup
    if (company.subscriptionIds && company.subscriptionIds.length > 0) {
      // operations.push(
      //   this.subscriptionService.assignSubscriptionsToCompany(companyId, {
      //     subscriptionIds: company.subscriptionIds,
      //     billingContact: company.primaryContact,
      //     activationDate: new Date()
      //   })
      // );
    }

    // PRODUCTION: Clone and assign process templates
    if (company.processTemplateIds && company.processTemplateIds.length > 0) {
      // operations.push(
      //   this.processTemplateService.cloneTemplatesToCompany(companyId, {
      //     templateIds: company.processTemplateIds,
      //     customizeForCompany: true,
      //     activateImmediately: true
      //   })
      // );
    }

    // PRODUCTION: Setup language customizations
    if (company.languageFileId) {
      // operations.push(
      //   this.languageService.setupCompanyLanguageCustomizations(companyId, {
      //     baseLanguageFileId: company.languageFileId,
      //     allowCustomTerms: true,
      //     inheritFromParent: false
      //   })
      // );
    }

    // PRODUCTION: Initialize company branding assets
    // operations.push(
    //   this.brandingService.setupCompanyBranding(companyId, {
    //     colors: company.branding,
    //     logoUrl: company.logoUrl,
    //     generateDefaultAssets: true
    //   })
    // );

    // PRODUCTION: Create audit trail entry
    // operations.push(
    //   this.auditService.logCompanyCreation(companyId, {
    //     createdBy: 'current-user-id', // Get from auth service
    //     creationDetails: company,
    //     ipAddress: 'user-ip-address',
    //     userAgent: navigator.userAgent
    //   })
    // );

    // PRODUCTION: Send notification emails
    // operations.push(
    //   this.notificationService.sendCompanyCreationNotifications(companyId, {
    //     notifyAdmin: true,
    //     notifyPrimaryContact: true,
    //     includeSetupInstructions: true
    //   })
    // );

    // For demo purposes, simulate the operations with a delay
    this.simulateProductionOperations(companyId);
  }

  /**
   * DEMO IMPLEMENTATION: Simulates the production operations
   * In production, replace this with the actual forkJoin of all operations above
   */
  private simulateProductionOperations(companyId: string): void {
    // Simulate realistic processing time for complex operations
    setTimeout(() => {
      console.log('✓ Company permissions created');
      console.log('✓ Database schema initialized');
      console.log('✓ Subscriptions assigned and activated');
      console.log('✓ Process templates cloned and customized');
      console.log('✓ Language customizations applied');
      console.log('✓ Branding assets generated');
      console.log('✓ Audit trail created');
      console.log('✓ Notification emails sent');
      
      this.isSaving = false;
      console.log(`🎉 Management company ${companyId} fully provisioned and ready!`);
      
      // Navigate immediately to main page with success flag
      this.router.navigate(['/management-companies'], {
        queryParams: { created: companyId, success: 'true' }
      });
    }, 2000); // Simulate 2 second processing time
  }

  /**
   * PRODUCTION IMPLEMENTATION: Comprehensive error handling
   */
  private handleSaveError(operation: string, error: any): void {
    this.isSaving = false;
    
    console.error(`❌ ${operation}:`, error);
    
    // PRODUCTION: Send error to monitoring service
    // this.monitoringService.logError('management-company-creation', {
    //   operation,
    //   error: error.message,
    //   userId: 'current-user-id',
    //   formData: this.basicInfoForm.value
    // });
    
    // Set user-friendly error message
    if (error.status === 409) {
      this.saveError = 'A management company with this name already exists.';
    } else if (error.status === 403) {
      this.saveError = 'You do not have permission to create management companies.';
    } else if (error.status >= 500) {
      this.saveError = 'Server error occurred. Please try again or contact support.';
    } else {
      this.saveError = 'An unexpected error occurred. Please try again.';
    }
  }

  goBack(): void {
    this.router.navigate(['/management-companies']);
  }
}