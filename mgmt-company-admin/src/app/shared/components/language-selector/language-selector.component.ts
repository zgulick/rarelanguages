import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface LanguageFile {
  id: string;
  name: string;
  code: string;
  flag: string;
  isDefault: boolean;
  termCount: number;
  lastModified: Date;
  customTerms: LanguageTerm[];
}

export interface LanguageTerm {
  key: string;
  defaultValue: string;
  customValue?: string;
  category: 'ui' | 'messages' | 'errors' | 'actions' | 'labels';
  isModified: boolean;
}

export interface LanguageSelection {
  selectedLanguageId: string;
  customTerms: { [termKey: string]: string };
}

@Component({
  selector: 'app-language-selector',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTabsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="language-selector">
      <!-- Language Selection Header -->
      <div class="language-header">
        <h4 class="section-title">Language Customization</h4>
        <p class="section-description">
          Select a base language and customize specific terms for your management company interface.
        </p>
      </div>

      <!-- Language File Selection -->
      <div class="language-selection">
        <mat-form-field appearance="outline" class="language-dropdown">
          <mat-label>Base Language</mat-label>
          <mat-select 
            [(value)]="selectedLanguageId"
            (selectionChange)="onLanguageChange($event.value)">
            <mat-option 
              *ngFor="let language of availableLanguages" 
              [value]="language.id">
              <div class="language-option">
                <span class="flag">{{ language.flag }}</span>
                <span class="name">{{ language.name }}</span>
                <span class="code">({{ language.code }})</span>
                <span class="default-badge" *ngIf="language.isDefault">Default</span>
              </div>
            </mat-option>
          </mat-select>
        </mat-form-field>

        <div class="language-info" *ngIf="selectedLanguage">
          <div class="info-card">
            <div class="info-header">
              <span class="flag-large">{{ selectedLanguage.flag }}</span>
              <div class="info-details">
                <h5 class="language-name">{{ selectedLanguage.name }}</h5>
                <p class="language-stats">
                  {{ selectedLanguage.termCount }} terms • 
                  {{ getModifiedTermsCount() }} customized
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Terms Customization -->
      <div class="terms-customization" *ngIf="selectedLanguage">
        <div class="customization-header">
          <h5 class="customization-title">Customize Terms</h5>
          <div class="customization-actions">
            <button 
              mat-stroked-button 
              color="primary"
              (click)="resetAllTerms()"
              [disabled]="getModifiedTermsCount() === 0">
              <mat-icon>refresh</mat-icon>
              Reset All
            </button>
            <button 
              mat-flat-button 
              color="primary"
              (click)="previewChanges()"
              [disabled]="getModifiedTermsCount() === 0">
              <mat-icon>visibility</mat-icon>
              Preview
            </button>
          </div>
        </div>

        <!-- Term Categories Tabs -->
        <mat-tab-group class="terms-tabs" [(selectedIndex)]="selectedTabIndex">
          <mat-tab 
            *ngFor="let category of termCategories" 
            [label]="category.label">
            <div class="terms-category">
              <div class="category-header">
                <p class="category-description">{{ category.description }}</p>
                <div class="category-stats">
                  <mat-chip class="stats-chip">
                    {{ getTermsByCategory(category.key).length }} terms
                  </mat-chip>
                  <mat-chip 
                    class="modified-chip" 
                    *ngIf="getModifiedTermsByCategory(category.key).length > 0">
                    {{ getModifiedTermsByCategory(category.key).length }} modified
                  </mat-chip>
                </div>
              </div>

              <!-- Search Terms -->
              <div class="terms-search">
                <mat-form-field appearance="outline" class="search-field">
                  <mat-label>Search terms...</mat-label>
                  <input 
                    matInput 
                    [(ngModel)]="searchTerms[category.key]"
                    (ngModelChange)="onSearchChange(category.key)"
                    placeholder="Search by key or value...">
                  <mat-icon matPrefix>search</mat-icon>
                </mat-input>
              </div>

              <!-- Terms List -->
              <div class="terms-list">
                <div 
                  *ngFor="let term of getFilteredTerms(category.key)" 
                  class="term-item"
                  [class.modified]="term.isModified">
                  
                  <div class="term-header">
                    <div class="term-key">
                      <span class="key-text">{{ term.key }}</span>
                      <mat-icon class="modified-icon" *ngIf="term.isModified">edit</mat-icon>
                    </div>
                    <button 
                      mat-icon-button 
                      color="primary"
                      *ngIf="term.isModified"
                      (click)="resetTerm(term)"
                      matTooltip="Reset to default">
                      <mat-icon>refresh</mat-icon>
                    </button>
                  </div>
                  
                  <div class="term-values">
                    <div class="default-value">
                      <label class="value-label">Default:</label>
                      <span class="value-text">{{ term.defaultValue }}</span>
                    </div>
                    
                    <div class="custom-value">
                      <mat-form-field appearance="outline" class="term-input">
                        <mat-label>Custom Value</mat-label>
                        <input 
                          matInput 
                          [(ngModel)]="term.customValue"
                          (ngModelChange)="onTermChange(term)"
                          [placeholder]="term.defaultValue">
                      </mat-form-field>
                    </div>
                  </div>
                </div>

                <!-- Empty State -->
                <div class="empty-state" *ngIf="getFilteredTerms(category.key).length === 0">
                  <mat-icon class="empty-icon">search_off</mat-icon>
                  <h6 class="empty-title">No terms found</h6>
                  <p class="empty-description">
                    Try adjusting your search criteria or select a different category.
                  </p>
                </div>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>

      <!-- Preview Modal would go here in a real implementation -->
      <!-- Summary of Changes -->
      <div class="changes-summary" *ngIf="getModifiedTermsCount() > 0">
        <div class="summary-card">
          <div class="summary-header">
            <mat-icon class="summary-icon">edit</mat-icon>
            <div class="summary-info">
              <h6 class="summary-title">Customization Summary</h6>
              <p class="summary-text">
                {{ getModifiedTermsCount() }} terms have been customized from the default {{ selectedLanguage?.name }} language.
              </p>
            </div>
          </div>
          
          <div class="summary-actions">
            <button 
              mat-flat-button 
              color="primary"
              (click)="saveChanges()">
              Save Customizations
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./language-selector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSelectorComponent implements OnInit {
  @Input() initialSelection: LanguageSelection | null = null;
  @Output() languageChange = new EventEmitter<LanguageSelection>();

  selectedLanguageId: string = '';
  selectedLanguage: LanguageFile | null = null;
  selectedTabIndex = 0;
  
  searchTerms: { [category: string]: string } = {};
  
  availableLanguages: LanguageFile[] = [
    {
      id: 'en-us',
      name: 'English (US)',
      code: 'en-US',
      flag: '🇺🇸',
      isDefault: true,
      termCount: 247,
      lastModified: new Date('2024-01-15'),
      customTerms: this.generateSampleTerms()
    },
    {
      id: 'en-gb',
      name: 'English (UK)',
      code: 'en-GB',
      flag: '🇬🇧',
      isDefault: false,
      termCount: 247,
      lastModified: new Date('2024-01-10'),
      customTerms: this.generateSampleTerms('uk')
    },
    {
      id: 'es-es',
      name: 'Spanish (Spain)',
      code: 'es-ES',
      flag: '🇪🇸',
      isDefault: false,
      termCount: 243,
      lastModified: new Date('2024-01-08'),
      customTerms: this.generateSampleTerms('es')
    },
    {
      id: 'fr-fr',
      name: 'French (France)',
      code: 'fr-FR',
      flag: '🇫🇷',
      isDefault: false,
      termCount: 239,
      lastModified: new Date('2024-01-05'),
      customTerms: this.generateSampleTerms('fr')
    },
    {
      id: 'de-de',
      name: 'German (Germany)',
      code: 'de-DE',
      flag: '🇩🇪',
      isDefault: false,
      termCount: 251,
      lastModified: new Date('2024-01-03'),
      customTerms: this.generateSampleTerms('de')
    }
  ];

  termCategories = [
    {
      key: 'ui' as const,
      label: 'User Interface',
      description: 'Buttons, menus, navigation elements, and general interface text'
    },
    {
      key: 'messages' as const,
      label: 'Messages',
      description: 'Success messages, notifications, and informational text'
    },
    {
      key: 'errors' as const,
      label: 'Error Messages',
      description: 'Validation errors, system errors, and warning messages'
    },
    {
      key: 'actions' as const,
      label: 'Actions',
      description: 'Action buttons, links, and interactive element labels'
    },
    {
      key: 'labels' as const,
      label: 'Form Labels',
      description: 'Form field labels, placeholders, and input descriptions'
    }
  ];

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    if (this.initialSelection) {
      this.selectedLanguageId = this.initialSelection.selectedLanguageId;
      this.loadLanguage(this.selectedLanguageId);
      this.applyCustomTerms(this.initialSelection.customTerms);
    } else {
      // Default to first available language
      this.selectedLanguageId = this.availableLanguages[0].id;
      this.loadLanguage(this.selectedLanguageId);
    }
  }

  onLanguageChange(languageId: string): void {
    this.selectedLanguageId = languageId;
    this.loadLanguage(languageId);
    this.emitLanguageChange();
  }

  private loadLanguage(languageId: string): void {
    this.selectedLanguage = this.availableLanguages.find(lang => lang.id === languageId) || null;
    
    // Reset search terms when language changes
    this.searchTerms = {};
    this.termCategories.forEach(category => {
      this.searchTerms[category.key] = '';
    });
  }

  private applyCustomTerms(customTerms: { [termKey: string]: string }): void {
    if (!this.selectedLanguage) return;
    
    this.selectedLanguage.customTerms.forEach(term => {
      if (customTerms[term.key]) {
        term.customValue = customTerms[term.key];
        term.isModified = true;
      }
    });
  }

  onTermChange(term: LanguageTerm): void {
    term.isModified = !!(term.customValue && term.customValue.trim() && term.customValue !== term.defaultValue);
    this.emitLanguageChange();
  }

  onSearchChange(category: string): void {
    // Search functionality is implemented in getFilteredTerms
  }

  resetTerm(term: LanguageTerm): void {
    term.customValue = '';
    term.isModified = false;
    this.emitLanguageChange();
    
    this.snackBar.open(`Term "${term.key}" reset to default`, 'Close', {
      duration: 2000
    });
  }

  resetAllTerms(): void {
    if (!this.selectedLanguage) return;
    
    this.selectedLanguage.customTerms.forEach(term => {
      term.customValue = '';
      term.isModified = false;
    });
    
    this.emitLanguageChange();
    
    this.snackBar.open('All terms reset to default', 'Close', {
      duration: 3000
    });
  }

  previewChanges(): void {
    // In a real implementation, this would open a preview modal
    this.snackBar.open('Preview functionality would open a modal here', 'Close', {
      duration: 3000
    });
  }

  saveChanges(): void {
    this.snackBar.open('Language customizations saved successfully!', 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  getTermsByCategory(category: string): LanguageTerm[] {
    if (!this.selectedLanguage) return [];
    return this.selectedLanguage.customTerms.filter(term => term.category === category);
  }

  getModifiedTermsByCategory(category: string): LanguageTerm[] {
    return this.getTermsByCategory(category).filter(term => term.isModified);
  }

  getFilteredTerms(category: string): LanguageTerm[] {
    let terms = this.getTermsByCategory(category);
    
    const searchTerm = this.searchTerms[category]?.toLowerCase() || '';
    if (searchTerm) {
      terms = terms.filter(term => 
        term.key.toLowerCase().includes(searchTerm) ||
        term.defaultValue.toLowerCase().includes(searchTerm) ||
        (term.customValue && term.customValue.toLowerCase().includes(searchTerm))
      );
    }
    
    return terms;
  }

  getModifiedTermsCount(): number {
    if (!this.selectedLanguage) return 0;
    return this.selectedLanguage.customTerms.filter(term => term.isModified).length;
  }

  private emitLanguageChange(): void {
    if (!this.selectedLanguage) return;
    
    const customTerms: { [termKey: string]: string } = {};
    this.selectedLanguage.customTerms
      .filter(term => term.isModified && term.customValue)
      .forEach(term => {
        customTerms[term.key] = term.customValue!;
      });

    this.languageChange.emit({
      selectedLanguageId: this.selectedLanguageId,
      customTerms
    });
  }

  private generateSampleTerms(variant: string = 'us'): LanguageTerm[] {
    const baseTerms = [
      // UI Category
      { key: 'button.save', defaultValue: 'Save', category: 'ui' as const },
      { key: 'button.cancel', defaultValue: 'Cancel', category: 'ui' as const },
      { key: 'button.edit', defaultValue: 'Edit', category: 'ui' as const },
      { key: 'button.delete', defaultValue: 'Delete', category: 'ui' as const },
      { key: 'nav.dashboard', defaultValue: 'Dashboard', category: 'ui' as const },
      { key: 'nav.companies', defaultValue: 'Companies', category: 'ui' as const },
      { key: 'nav.settings', defaultValue: 'Settings', category: 'ui' as const },
      
      // Messages Category
      { key: 'message.save.success', defaultValue: 'Successfully saved', category: 'messages' as const },
      { key: 'message.delete.success', defaultValue: 'Successfully deleted', category: 'messages' as const },
      { key: 'message.welcome', defaultValue: 'Welcome to the management portal', category: 'messages' as const },
      
      // Errors Category
      { key: 'error.required.field', defaultValue: 'This field is required', category: 'errors' as const },
      { key: 'error.invalid.email', defaultValue: 'Please enter a valid email address', category: 'errors' as const },
      { key: 'error.network', defaultValue: 'Network error. Please try again.', category: 'errors' as const },
      
      // Actions Category
      { key: 'action.create.new', defaultValue: 'Create New', category: 'actions' as const },
      { key: 'action.view.details', defaultValue: 'View Details', category: 'actions' as const },
      { key: 'action.download', defaultValue: 'Download', category: 'actions' as const },
      
      // Labels Category
      { key: 'label.company.name', defaultValue: 'Company Name', category: 'labels' as const },
      { key: 'label.email.address', defaultValue: 'Email Address', category: 'labels' as const },
      { key: 'label.phone.number', defaultValue: 'Phone Number', category: 'labels' as const }
    ];

    // Apply variants based on language/region
    return baseTerms.map(term => {
      let defaultValue = term.defaultValue;
      
      switch (variant) {
        case 'uk':
          if (term.key === 'label.phone.number') defaultValue = 'Mobile Number';
          break;
        case 'es':
          // In a real app, these would be actual Spanish translations
          if (term.key === 'button.save') defaultValue = 'Guardar';
          if (term.key === 'button.cancel') defaultValue = 'Cancelar';
          break;
        case 'fr':
          // In a real app, these would be actual French translations
          if (term.key === 'button.save') defaultValue = 'Enregistrer';
          if (term.key === 'button.cancel') defaultValue = 'Annuler';
          break;
        case 'de':
          // In a real app, these would be actual German translations
          if (term.key === 'button.save') defaultValue = 'Speichern';
          if (term.key === 'button.cancel') defaultValue = 'Abbrechen';
          break;
      }
      
      return {
        ...term,
        defaultValue,
        customValue: '',
        isModified: false
      };
    });
  }
}