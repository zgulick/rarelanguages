import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ColorPalette {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  description?: string;
}

export interface ColorSelection {
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor: string;
  useDefaultColors: boolean;
}

@Component({
  selector: 'app-color-picker',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="color-picker">
      <!-- Use Default Colors Toggle -->
      <div class="default-toggle-section">
        <mat-checkbox
          [(ngModel)]="useDefaultColors"
          (ngModelChange)="onDefaultToggleChange()"
          class="default-checkbox">
          Use default professional color scheme
        </mat-checkbox>
        <p class="toggle-description">
          Choose from our curated professional palettes or customize your own colors
        </p>
      </div>

      <!-- Default Color Palettes -->
      <div class="default-palettes" *ngIf="useDefaultColors">
        <h4 class="section-title">Professional Color Palettes</h4>
        
        <div class="palette-grid">
          <div 
            *ngFor="let palette of defaultPalettes" 
            class="palette-card"
            [class.selected]="isSelectedPalette(palette)"
            (click)="selectPalette(palette)">
            
            <div class="palette-preview">
              <div class="color-row">
                <div 
                  class="color-swatch primary-swatch" 
                  [style.background-color]="palette.primaryColor"
                  [title]="'Primary: ' + palette.primaryColor">
                </div>
                <div 
                  class="color-swatch secondary-swatch" 
                  [style.background-color]="palette.secondaryColor"
                  [title]="'Secondary: ' + palette.secondaryColor">
                </div>
                <div 
                  class="color-swatch tertiary-swatch" 
                  [style.background-color]="palette.tertiaryColor"
                  [title]="'Tertiary: ' + palette.tertiaryColor">
                </div>
              </div>
            </div>
            
            <div class="palette-info">
              <h5 class="palette-name">{{ palette.name }}</h5>
              <p class="palette-description">{{ palette.description }}</p>
            </div>

            <mat-icon class="selected-icon" *ngIf="isSelectedPalette(palette)">
              check_circle
            </mat-icon>
          </div>
        </div>
      </div>

      <!-- Custom Color Selection -->
      <div class="custom-colors" *ngIf="!useDefaultColors">
        <h4 class="section-title">Custom Color Selection</h4>
        
        <div class="custom-color-grid">
          <!-- Primary Color -->
          <div class="color-input-group">
            <label class="color-label">Primary Color</label>
            <div class="color-input-container">
              <input 
                type="color" 
                [(ngModel)]="selectedColors.primaryColor"
                (ngModelChange)="onColorChange()"
                class="color-input"
                id="primaryColor">
              <mat-form-field appearance="outline" class="hex-input">
                <mat-label>Hex Code</mat-label>
                <input 
                  matInput 
                  [(ngModel)]="selectedColors.primaryColor"
                  (ngModelChange)="onColorChange()"
                  placeholder="#1976d2"
                  pattern="^#[0-9A-Fa-f]{6}$">
              </mat-form-field>
            </div>
            <div class="color-preview-large" [style.background-color]="selectedColors.primaryColor">
              <span class="preview-text">Primary</span>
            </div>
          </div>

          <!-- Secondary Color -->
          <div class="color-input-group">
            <label class="color-label">Secondary Color</label>
            <div class="color-input-container">
              <input 
                type="color" 
                [(ngModel)]="selectedColors.secondaryColor"
                (ngModelChange)="onColorChange()"
                class="color-input"
                id="secondaryColor">
              <mat-form-field appearance="outline" class="hex-input">
                <mat-label>Hex Code</mat-label>
                <input 
                  matInput 
                  [(ngModel)]="selectedColors.secondaryColor"
                  (ngModelChange)="onColorChange()"
                  placeholder="#424242"
                  pattern="^#[0-9A-Fa-f]{6}$">
              </mat-form-field>
            </div>
            <div class="color-preview-large" [style.background-color]="selectedColors.secondaryColor">
              <span class="preview-text">Secondary</span>
            </div>
          </div>

          <!-- Tertiary Color -->
          <div class="color-input-group">
            <label class="color-label">Tertiary Color</label>
            <div class="color-input-container">
              <input 
                type="color" 
                [(ngModel)]="selectedColors.tertiaryColor"
                (ngModelChange)="onColorChange()"
                class="color-input"
                id="tertiaryColor">
              <mat-form-field appearance="outline" class="hex-input">
                <mat-label>Hex Code</mat-label>
                <input 
                  matInput 
                  [(ngModel)]="selectedColors.tertiaryColor"
                  (ngModelChange)="onColorChange()"
                  placeholder="#f5f5f5"
                  pattern="^#[0-9A-Fa-f]{6}$">
              </mat-form-field>
            </div>
            <div class="color-preview-large" [style.background-color]="selectedColors.tertiaryColor">
              <span class="preview-text">Tertiary</span>
            </div>
          </div>
        </div>

        <!-- Quick Color Suggestions -->
        <div class="color-suggestions">
          <h5 class="suggestions-title">Quick Suggestions</h5>
          <div class="suggestion-row">
            <div 
              *ngFor="let suggestion of colorSuggestions"
              class="suggestion-swatch"
              [style.background-color]="suggestion.color"
              [title]="suggestion.name + ': ' + suggestion.color"
              (click)="applySuggestion(suggestion)">
            </div>
          </div>
        </div>
      </div>

      <!-- Real-time Preview -->
      <div class="color-preview-section">
        <h4 class="section-title">Live Preview</h4>
        
        <div class="preview-mockup">
          <div class="mockup-header" [style.background-color]="selectedColors.primaryColor">
            <span class="mockup-title">Your Application Header</span>
            <div class="mockup-buttons">
              <button class="mockup-button" [style.background-color]="selectedColors.secondaryColor">
                Action
              </button>
            </div>
          </div>
          
          <div class="mockup-content" [style.background-color]="selectedColors.tertiaryColor">
            <div class="mockup-card" [style.border-left-color]="selectedColors.primaryColor">
              <h6 [style.color]="selectedColors.primaryColor">Sample Content Card</h6>
              <p>This preview shows how your selected colors will look in the application interface.</p>
              <button class="mockup-link" [style.color]="selectedColors.primaryColor">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Accessibility Check -->
      <div class="accessibility-check" *ngIf="!useDefaultColors">
        <div class="accessibility-item">
          <mat-icon [class]="contrastCheckPrimarySecondary ? 'check-pass' : 'check-fail'">
            {{ contrastCheckPrimarySecondary ? 'check_circle' : 'warning' }}
          </mat-icon>
          <span>Primary/Secondary contrast: {{ contrastCheckPrimarySecondary ? 'Good' : 'Poor' }}</span>
        </div>
        
        <div class="accessibility-item">
          <mat-icon [class]="contrastCheckPrimaryTertiary ? 'check-pass' : 'check-fail'">
            {{ contrastCheckPrimaryTertiary ? 'check_circle' : 'warning' }}
          </mat-icon>
          <span>Primary/Tertiary contrast: {{ contrastCheckPrimaryTertiary ? 'Good' : 'Poor' }}</span>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./color-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPickerComponent implements OnInit {
  @Input() initialColors: ColorSelection = {
    primaryColor: '#1976d2',
    secondaryColor: '#424242',
    tertiaryColor: '#f5f5f5',
    useDefaultColors: true
  };

  @Output() colorChange = new EventEmitter<ColorSelection>();

  selectedColors: ColorSelection = { ...this.initialColors };
  useDefaultColors: boolean = true;

  defaultPalettes: ColorPalette[] = [
    {
      name: 'Professional Blue',
      primaryColor: '#1976d2',
      secondaryColor: '#424242',
      tertiaryColor: '#f5f5f5',
      description: 'Classic corporate blue with neutral grays'
    },
    {
      name: 'Modern Teal',
      primaryColor: '#00796b',
      secondaryColor: '#004d40',
      tertiaryColor: '#e0f2f1',
      description: 'Contemporary teal with calming accents'
    },
    {
      name: 'Executive Purple',
      primaryColor: '#7b1fa2',
      secondaryColor: '#4a148c',
      tertiaryColor: '#f3e5f5',
      description: 'Sophisticated purple for premium brands'
    },
    {
      name: 'Corporate Green',
      primaryColor: '#388e3c',
      secondaryColor: '#1b5e20',
      tertiaryColor: '#e8f5e8',
      description: 'Professional green conveying growth'
    },
    {
      name: 'Premium Orange',
      primaryColor: '#f57c00',
      secondaryColor: '#e65100',
      tertiaryColor: '#fff3e0',
      description: 'Energetic orange for dynamic companies'
    },
    {
      name: 'Elegant Navy',
      primaryColor: '#1565c0',
      secondaryColor: '#0d47a1',
      tertiaryColor: '#e3f2fd',
      description: 'Deep navy for established businesses'
    }
  ];

  colorSuggestions = [
    { name: 'Material Blue', color: '#2196f3' },
    { name: 'Material Red', color: '#f44336' },
    { name: 'Material Green', color: '#4caf50' },
    { name: 'Material Purple', color: '#9c27b0' },
    { name: 'Material Orange', color: '#ff9800' },
    { name: 'Material Teal', color: '#009688' },
    { name: 'Material Indigo', color: '#3f51b5' },
    { name: 'Material Pink', color: '#e91e63' }
  ];

  get contrastCheckPrimarySecondary(): boolean {
    return this.checkContrast(this.selectedColors.primaryColor, this.selectedColors.secondaryColor);
  }

  get contrastCheckPrimaryTertiary(): boolean {
    return this.checkContrast(this.selectedColors.primaryColor, this.selectedColors.tertiaryColor);
  }

  ngOnInit(): void {
    this.selectedColors = { ...this.initialColors };
    this.useDefaultColors = this.initialColors.useDefaultColors;
  }

  onDefaultToggleChange(): void {
    this.selectedColors.useDefaultColors = this.useDefaultColors;
    
    if (this.useDefaultColors) {
      // Apply the first default palette
      this.selectPalette(this.defaultPalettes[0]);
    }
    
    this.emitColorChange();
  }

  selectPalette(palette: ColorPalette): void {
    this.selectedColors = {
      primaryColor: palette.primaryColor,
      secondaryColor: palette.secondaryColor,
      tertiaryColor: palette.tertiaryColor,
      useDefaultColors: true
    };
    this.emitColorChange();
  }

  isSelectedPalette(palette: ColorPalette): boolean {
    return this.useDefaultColors &&
           this.selectedColors.primaryColor === palette.primaryColor &&
           this.selectedColors.secondaryColor === palette.secondaryColor &&
           this.selectedColors.tertiaryColor === palette.tertiaryColor;
  }

  onColorChange(): void {
    this.selectedColors.useDefaultColors = false;
    this.emitColorChange();
  }

  applySuggestion(suggestion: { name: string; color: string }): void {
    // Apply suggestion to primary color and generate complementary colors
    this.selectedColors.primaryColor = suggestion.color;
    this.selectedColors.secondaryColor = this.generateComplementaryColor(suggestion.color, -20);
    this.selectedColors.tertiaryColor = this.generateComplementaryColor(suggestion.color, 85);
    this.selectedColors.useDefaultColors = false;
    this.onColorChange();
  }

  private emitColorChange(): void {
    this.colorChange.emit({ ...this.selectedColors });
  }

  private checkContrast(color1: string, color2: string): boolean {
    // Simple contrast check - in a real app, this would use WCAG contrast ratio calculation
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return false;
    
    const brightness1 = (rgb1.r * 299 + rgb1.g * 587 + rgb1.b * 114) / 1000;
    const brightness2 = (rgb2.r * 299 + rgb2.g * 587 + rgb2.b * 114) / 1000;
    
    return Math.abs(brightness1 - brightness2) > 125;
  }

  private hexToRgb(hex: string): {r: number, g: number, b: number} | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private generateComplementaryColor(baseColor: string, lightnessDiff: number): string {
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return baseColor;

    // Adjust lightness
    const factor = lightnessDiff > 0 ? (255 - Math.max(rgb.r, rgb.g, rgb.b)) : Math.min(rgb.r, rgb.g, rgb.b);
    const adjustment = factor * (Math.abs(lightnessDiff) / 100);

    const newR = Math.max(0, Math.min(255, rgb.r + (lightnessDiff > 0 ? adjustment : -adjustment)));
    const newG = Math.max(0, Math.min(255, rgb.g + (lightnessDiff > 0 ? adjustment : -adjustment)));
    const newB = Math.max(0, Math.min(255, rgb.b + (lightnessDiff > 0 ? adjustment : -adjustment)));

    return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
  }
}