import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ProcessKeyField, FieldType } from '../../../models';

@Component({
  selector: 'app-process-key-fields',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <mat-card class="key-fields-card" *ngIf="keyFields.length > 0">
      <mat-card-header>
        <mat-card-title class="fields-title">
          <mat-icon class="title-icon">info</mat-icon>
          Key Information
        </mat-card-title>
        <div class="header-actions">
          <button 
            mat-icon-button 
            (click)="onEditToggle()"
            [matTooltip]="isEditMode ? 'Save changes' : 'Edit fields'"
            [color]="isEditMode ? 'primary' : 'default'"
          >
            <mat-icon>{{ isEditMode ? 'save' : 'edit' }}</mat-icon>
          </button>
          
          <button 
            mat-icon-button 
            (click)="onRefresh()"
            matTooltip="Refresh data"
          >
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <div class="fields-grid">
          <div 
            *ngFor="let field of keyFields; trackBy: trackByFieldId"
            class="field-item"
            [class.readonly]="!field.editable && !isEditMode"
            [class.required]="field.required"
          >
            <!-- Text Input -->
            <mat-form-field 
              *ngIf="field.type === FieldType.TEXT" 
              appearance="outline"
              class="field-input"
            >
              <mat-label>{{ field.label }}</mat-label>
              <input 
                matInput 
                [value]="getFieldValue(field)"
                [readonly]="!field.editable || !isEditMode"
                (blur)="onFieldChange(field, $event)"
                [placeholder]="getFieldPlaceholder(field)"
              >
              <mat-icon 
                matSuffix 
                *ngIf="field.required"
                class="required-icon"
                matTooltip="Required field"
              >
                star
              </mat-icon>
            </mat-form-field>

            <!-- Number Input -->
            <mat-form-field 
              *ngIf="field.type === FieldType.NUMBER" 
              appearance="outline"
              class="field-input"
            >
              <mat-label>{{ field.label }}</mat-label>
              <input 
                matInput 
                type="number"
                [value]="getFieldValue(field)"
                [readonly]="!field.editable || !isEditMode"
                (blur)="onFieldChange(field, $event)"
                [placeholder]="getFieldPlaceholder(field)"
              >
              <span matSuffix class="number-suffix">{{ getNumberSuffix(field) }}</span>
            </mat-form-field>

            <!-- Date Input -->
            <mat-form-field 
              *ngIf="field.type === FieldType.DATE" 
              appearance="outline"
              class="field-input"
            >
              <mat-label>{{ field.label }}</mat-label>
              <input 
                matInput 
                [matDatepicker]="getDatePicker(field.id)"
                [value]="getDateValue(field)"
                [readonly]="!field.editable || !isEditMode"
                (dateChange)="onDateChange(field, $event)"
              >
              <mat-datepicker-toggle 
                matIconSuffix 
                [for]="getDatePicker(field.id)"
                [disabled]="!field.editable || !isEditMode"
              ></mat-datepicker-toggle>
              <mat-datepicker #datePicker></mat-datepicker>
            </mat-form-field>

            <!-- Select Input -->
            <mat-form-field 
              *ngIf="field.type === FieldType.SELECT" 
              appearance="outline"
              class="field-input"
            >
              <mat-label>{{ field.label }}</mat-label>
              <mat-select 
                [value]="getFieldValue(field)"
                [disabled]="!field.editable || !isEditMode"
                (selectionChange)="onSelectChange(field, $event)"
              >
                <mat-option *ngFor="let option of getSelectOptions(field)" [value]="option.value">
                  {{ option.label }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Textarea Input -->
            <mat-form-field 
              *ngIf="field.type === FieldType.TEXTAREA" 
              appearance="outline"
              class="field-input textarea-field"
            >
              <mat-label>{{ field.label }}</mat-label>
              <textarea 
                matInput 
                rows="3"
                [value]="getFieldValue(field)"
                [readonly]="!field.editable || !isEditMode"
                (blur)="onFieldChange(field, $event)"
                [placeholder]="getFieldPlaceholder(field)"
              ></textarea>
            </mat-form-field>

            <!-- Boolean Input -->
            <div *ngIf="field.type === FieldType.BOOLEAN" class="boolean-field">
              <label class="boolean-label">{{ field.label }}</label>
              <mat-chip-listbox 
                class="boolean-chips"
                [disabled]="!field.editable || !isEditMode"
              >
                <mat-chip-option 
                  [selected]="getBooleanValue(field) === true"
                  (click)="onBooleanChange(field, true)"
                  [disabled]="!field.editable || !isEditMode"
                >
                  <mat-icon>check</mat-icon>
                  Yes
                </mat-chip-option>
                <mat-chip-option 
                  [selected]="getBooleanValue(field) === false"
                  (click)="onBooleanChange(field, false)"
                  [disabled]="!field.editable || !isEditMode"
                >
                  <mat-icon>close</mat-icon>
                  No
                </mat-chip-option>
              </mat-chip-listbox>
            </div>

            <!-- Field Info -->
            <div class="field-info" *ngIf="hasFieldInfo(field)">
              <mat-icon 
                class="info-icon"
                [matTooltip]="getFieldTooltip(field)"
              >
                info_outline
              </mat-icon>
              <span class="last-updated" *ngIf="getLastUpdated(field)">
                Updated {{ getLastUpdated(field) | date:'short' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="field-actions" *ngIf="isEditMode">
          <button mat-button (click)="onCancel()">
            Cancel
          </button>
          <button mat-raised-button color="primary" (click)="onSave()" [disabled]="!hasChanges">
            Save Changes
          </button>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Empty State -->
    <div class="empty-state" *ngIf="keyFields.length === 0">
      <mat-icon class="empty-icon">info</mat-icon>
      <h3>No Key Fields</h3>
      <p>Select a process to view its key information fields.</p>
    </div>
  `,
  styles: [`
    .key-fields-card {
      margin-bottom: 24px;
      
      .mat-mdc-card-header {
        padding-bottom: 8px;
        
        .fields-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          
          .title-icon {
            color: var(--primary-color);
          }
        }
        
        .header-actions {
          display: flex;
          gap: 4px;
        }
      }
    }

    .fields-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 16px;
    }

    .field-item {
      position: relative;
      
      &.readonly {
        .field-input {
          ::ng-deep .mat-mdc-form-field-wrapper {
            background-color: #f8f9fa;
          }
        }
      }
      
      &.required {
        .field-input {
          ::ng-deep .mat-mdc-floating-label {
            &::after {
              content: ' *';
              color: #f44336;
            }
          }
        }
      }
      
      .field-input {
        width: 100%;
        
        &.textarea-field {
          .mat-mdc-form-field-wrapper {
            min-height: auto;
          }
        }
        
        .required-icon {
          color: #f44336;
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
        
        .number-suffix {
          font-size: 12px;
          color: #666;
          margin-left: 4px;
        }
      }
      
      .boolean-field {
        .boolean-label {
          display: block;
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
          font-weight: 500;
        }
        
        .boolean-chips {
          display: flex;
          gap: 8px;
          
          mat-chip-option {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 13px;
            
            mat-icon {
              font-size: 16px;
              width: 16px;
              height: 16px;
            }
          }
        }
      }
      
      .field-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 4px;
        
        .info-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: #999;
        }
        
        .last-updated {
          font-size: 11px;
          color: #999;
        }
      }
    }

    .field-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px;
      text-align: center;
      color: #666;
      
      .empty-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      h3 {
        margin: 0 0 8px 0;
        font-weight: 400;
      }
      
      p {
        margin: 0;
        font-size: 14px;
      }
    }

    // Responsive Design
    @media (max-width: 768px) {
      .fields-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }
      
      .field-actions {
        flex-direction: column-reverse;
        
        button {
          width: 100%;
        }
      }
    }
  `]
})
export class ProcessKeyFieldsComponent {
  @Input() keyFields: ProcessKeyField[] = [];
  @Input() isLoading = false;

  @Output() fieldChange = new EventEmitter<{field: ProcessKeyField, value: any}>();
  @Output() save = new EventEmitter<ProcessKeyField[]>();
  @Output() refresh = new EventEmitter<void>();

  isEditMode = false;
  hasChanges = false;
  originalFields: ProcessKeyField[] = [];

  FieldType = FieldType;

  ngOnChanges() {
    if (this.keyFields.length > 0) {
      this.originalFields = JSON.parse(JSON.stringify(this.keyFields));
      this.hasChanges = false;
    }
  }

  trackByFieldId(index: number, field: ProcessKeyField): string {
    return field.id;
  }

  onEditToggle() {
    if (this.isEditMode) {
      this.onSave();
    } else {
      this.isEditMode = true;
      this.originalFields = JSON.parse(JSON.stringify(this.keyFields));
    }
  }

  onFieldChange(field: ProcessKeyField, event: Event) {
    if (!this.isEditMode || !field.editable) return;
    
    const target = event.target as HTMLInputElement;
    const newValue = field.type === FieldType.NUMBER ? parseFloat(target.value) : target.value;
    
    this.updateFieldValue(field, newValue);
  }

  onDateChange(field: ProcessKeyField, event: any) {
    if (!this.isEditMode || !field.editable) return;
    
    this.updateFieldValue(field, event.value);
  }

  onSelectChange(field: ProcessKeyField, event: any) {
    if (!this.isEditMode || !field.editable) return;
    
    this.updateFieldValue(field, event.value);
  }

  onBooleanChange(field: ProcessKeyField, value: boolean) {
    if (!this.isEditMode || !field.editable) return;
    
    this.updateFieldValue(field, value);
  }

  onSave() {
    this.save.emit([...this.keyFields]);
    this.isEditMode = false;
    this.hasChanges = false;
  }

  onCancel() {
    this.keyFields = JSON.parse(JSON.stringify(this.originalFields));
    this.isEditMode = false;
    this.hasChanges = false;
  }

  onRefresh() {
    this.refresh.emit();
  }

  private updateFieldValue(field: ProcessKeyField, value: any) {
    const fieldIndex = this.keyFields.findIndex(f => f.id === field.id);
    if (fieldIndex !== -1) {
      this.keyFields[fieldIndex] = { ...field, value };
      this.hasChanges = true;
      this.fieldChange.emit({ field: this.keyFields[fieldIndex], value });
    }
  }

  getFieldValue(field: ProcessKeyField): string {
    if (field.value === null || field.value === undefined) return '';
    return field.value.toString();
  }

  getDateValue(field: ProcessKeyField): Date | null {
    if (!field.value) return null;
    if (field.value instanceof Date) return field.value;
    if (typeof field.value === 'string' || typeof field.value === 'number') {
      return new Date(field.value);
    }
    return null;
  }

  getBooleanValue(field: ProcessKeyField): boolean | null {
    if (field.value === null || field.value === undefined) return null;
    return Boolean(field.value);
  }

  getDatePicker(fieldId: string): any {
    // Return a reference to the datepicker - in real implementation this would be handled differently
    return null;
  }

  getSelectOptions(field: ProcessKeyField): {value: any, label: string}[] {
    // Mock select options based on field name
    const optionsMap: Record<string, {value: any, label: string}[]> = {
      'overallCondition': [
        { value: 'excellent', label: 'Excellent' },
        { value: 'good', label: 'Good' },
        { value: 'fair', label: 'Fair' },
        { value: 'poor', label: 'Poor' }
      ],
      'complianceStatus': [
        { value: 'compliant', label: 'Compliant' },
        { value: 'non_compliant', label: 'Non-Compliant' },
        { value: 'pending', label: 'Pending Review' }
      ]
    };
    
    return optionsMap[field.name] || [];
  }

  getFieldPlaceholder(field: ProcessKeyField): string {
    const placeholders: Record<string, string> = {
      [FieldType.TEXT]: 'Enter text...',
      [FieldType.NUMBER]: 'Enter number...',
      [FieldType.TEXTAREA]: 'Enter description...'
    };
    
    return placeholders[field.type] || '';
  }

  getNumberSuffix(field: ProcessKeyField): string {
    const suffixes: Record<string, string> = {
      'maintenanceBudget': '€',
      'occupancyRate': '%',
      'monthlyIncome': '€',
      'roi': '%'
    };
    
    return suffixes[field.name] || '';
  }

  hasFieldInfo(field: ProcessKeyField): boolean {
    return this.getFieldTooltip(field) !== '' || !!this.getLastUpdated(field);
  }

  getFieldTooltip(field: ProcessKeyField): string {
    const tooltips: Record<string, string> = {
      'maintenanceBudget': 'Annual budget allocated for maintenance activities',
      'occupancyRate': 'Percentage of occupied units',
      'roi': 'Return on investment percentage',
      'complianceStatus': 'Current regulatory compliance status'
    };
    
    return tooltips[field.name] || '';
  }

  getLastUpdated(field: ProcessKeyField): Date | null {
    // Mock last updated date - in real implementation this would come from the data
    return new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000);
  }
}