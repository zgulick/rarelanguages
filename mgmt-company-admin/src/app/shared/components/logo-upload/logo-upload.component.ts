import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface LogoUploadResult {
  file: File;
  dataUrl: string;
  fileName: string;
  fileSize: number;
}

@Component({
  selector: 'app-logo-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule
  ],
  template: `
    <div class="logo-upload">
      <!-- Upload Instructions -->
      <div class="upload-instructions">
        <h4 class="instructions-title">Company Logo</h4>
        <p class="instructions-text">
          Upload your company logo for branding customization. 
          Supported formats: SVG, PNG, JPG. Maximum size: 2MB.
        </p>
      </div>

      <!-- Upload Area -->
      <div 
        class="upload-area"
        [class.dragover]="isDragOver"
        [class.has-logo]="currentLogo"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="triggerFileInput()">
        
        <!-- Empty State -->
        <div class="upload-empty" *ngIf="!currentLogo && !isUploading">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <h5 class="upload-title">Drop your logo here</h5>
          <p class="upload-description">
            or <span class="upload-link">click to browse</span>
          </p>
          <div class="upload-formats">
            <span class="format-badge">SVG</span>
            <span class="format-badge">PNG</span>
            <span class="format-badge">JPG</span>
          </div>
        </div>

        <!-- Uploading State -->
        <div class="upload-progress" *ngIf="isUploading">
          <mat-icon class="progress-icon">file_upload</mat-icon>
          <h5 class="progress-title">Uploading logo...</h5>
          <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
          <p class="progress-text">{{ uploadProgress }}% complete</p>
        </div>

        <!-- Logo Preview -->
        <div class="logo-preview" *ngIf="currentLogo && !isUploading">
          <div class="preview-container">
            <img 
              [src]="currentLogo" 
              [alt]="logoFileName || 'Company logo'"
              class="preview-image"
              (load)="onImageLoad()"
              (error)="onImageError()">
          </div>
          
          <div class="preview-info">
            <h6 class="file-name">{{ logoFileName }}</h6>
            <p class="file-details">{{ formatFileSize(logoFileSize) }}</p>
          </div>

          <div class="preview-actions">
            <button 
              mat-icon-button 
              color="primary"
              matTooltip="Replace logo"
              (click)="$event.stopPropagation(); triggerFileInput()">
              <mat-icon>edit</mat-icon>
            </button>
            
            <button 
              mat-icon-button 
              color="warn"
              matTooltip="Remove logo"
              (click)="$event.stopPropagation(); removeLogo()">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <!-- Hidden File Input -->
        <input 
          #fileInput
          type="file" 
          accept=".svg,.png,.jpg,.jpeg"
          (change)="onFileSelected($event)"
          class="file-input"
          hidden>
      </div>

      <!-- Logo Guidelines -->
      <div class="upload-guidelines" *ngIf="!currentLogo">
        <h5 class="guidelines-title">Logo Guidelines</h5>
        <div class="guidelines-grid">
          <div class="guideline-item">
            <mat-icon class="guideline-icon">aspect_ratio</mat-icon>
            <div class="guideline-content">
              <h6>Optimal Dimensions</h6>
              <p>200x60px to 400x120px for best results</p>
            </div>
          </div>
          
          <div class="guideline-item">
            <mat-icon class="guideline-icon">palette</mat-icon>
            <div class="guideline-content">
              <h6>Transparent Background</h6>
              <p>Use PNG or SVG for transparent backgrounds</p>
            </div>
          </div>
          
          <div class="guideline-item">
            <mat-icon class="guideline-icon">high_quality</mat-icon>
            <div class="guideline-content">
              <h6>High Resolution</h6>
              <p>Vector SVG files work best for all screen sizes</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Logo Variations Preview -->
      <div class="logo-variations" *ngIf="currentLogo">
        <h5 class="variations-title">Logo Preview in Different Contexts</h5>
        
        <div class="variations-grid">
          <!-- Light Background -->
          <div class="variation-item light">
            <div class="variation-header">
              <span class="variation-label">Light Background</span>
            </div>
            <div class="variation-preview">
              <img [src]="currentLogo" [alt]="logoFileName" class="variation-logo">
            </div>
          </div>

          <!-- Dark Background -->
          <div class="variation-item dark">
            <div class="variation-header">
              <span class="variation-label">Dark Background</span>
            </div>
            <div class="variation-preview">
              <img [src]="currentLogo" [alt]="logoFileName" class="variation-logo">
            </div>
          </div>

          <!-- Header Context -->
          <div class="variation-item header-context">
            <div class="variation-header">
              <span class="variation-label">Application Header</span>
            </div>
            <div class="variation-preview header-mockup">
              <img [src]="currentLogo" [alt]="logoFileName" class="header-logo">
              <span class="header-text">Management Company Admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./logo-upload.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LogoUploadComponent {
  @Input() currentLogo: string | null = null;
  @Input() logoFileName: string | null = null;
  @Input() logoFileSize: number = 0;
  @Input() maxFileSize: number = 2 * 1024 * 1024; // 2MB

  @Output() logoUploaded = new EventEmitter<LogoUploadResult>();
  @Output() logoRemoved = new EventEmitter<void>();

  isDragOver = false;
  isUploading = false;
  uploadProgress = 0;

  constructor(private snackBar: MatSnackBar) {}

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  triggerFileInput(): void {
    const fileInput = document.querySelector('.file-input') as HTMLInputElement;
    fileInput?.click();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File): void {
    // Validate file type
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      this.showError('Please upload a valid image file (SVG, PNG, or JPG)');
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.showError(`File size must be less than ${this.formatFileSize(this.maxFileSize)}`);
      return;
    }

    // Start upload simulation
    this.startUpload(file);
  }

  private startUpload(file: File): void {
    this.isUploading = true;
    this.uploadProgress = 0;

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      this.uploadProgress += Math.random() * 15;
      
      if (this.uploadProgress >= 100) {
        this.uploadProgress = 100;
        clearInterval(progressInterval);
        
        // Process the file
        setTimeout(() => {
          this.processFile(file);
        }, 500);
      }
    }, 200);
  }

  private processFile(file: File): void {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      
      const result: LogoUploadResult = {
        file,
        dataUrl,
        fileName: file.name,
        fileSize: file.size
      };

      this.isUploading = false;
      this.logoUploaded.emit(result);
      
      this.snackBar.open('Logo uploaded successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    };

    reader.onerror = () => {
      this.isUploading = false;
      this.showError('Error reading file. Please try again.');
    };

    reader.readAsDataURL(file);
  }

  removeLogo(): void {
    this.logoRemoved.emit();
    this.snackBar.open('Logo removed', 'Close', {
      duration: 2000
    });
  }

  onImageLoad(): void {
    // Image loaded successfully
  }

  onImageError(): void {
    this.showError('Error loading image preview');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      panelClass: ['error-snackbar']
    });
  }
}