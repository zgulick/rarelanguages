import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule
  ],
  template: `
    <div class="image-upload-container">
      <div class="upload-area" 
           [class.has-image]="currentImageUrl"
           [class.drag-over]="isDragOver"
           (click)="onAreaClick()"
           (dragover)="onDragOver($event)"
           (dragleave)="onDragLeave($event)"
           (drop)="onDrop($event)">
        
        <!-- Image Display -->
        <div class="image-display" *ngIf="currentImageUrl && !isUploading">
          <img [src]="currentImageUrl" [alt]="imageAlt" class="property-image">
          <div class="image-overlay">
            <button mat-icon-button class="overlay-btn" (click)="onChangeImage($event)" matTooltip="Change image">
              <mat-icon>edit</mat-icon>
            </button>
            <button mat-icon-button class="overlay-btn" (click)="onRemoveImage($event)" matTooltip="Remove image">
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>

        <!-- Upload Placeholder -->
        <div class="upload-placeholder" *ngIf="!currentImageUrl && !isUploading">
          <mat-icon class="upload-icon">add_a_photo</mat-icon>
          <span class="upload-text">Add Image</span>
          <span class="upload-hint">Click or drag to upload</span>
        </div>

        <!-- Upload Progress -->
        <div class="upload-progress" *ngIf="isUploading">
          <mat-icon class="progress-icon">cloud_upload</mat-icon>
          <span class="progress-text">Uploading...</span>
          <mat-progress-bar mode="determinate" [value]="uploadProgress"></mat-progress-bar>
          <span class="progress-percentage">{{ uploadProgress }}%</span>
        </div>

        <!-- Error State -->
        <div class="upload-error" *ngIf="uploadError">
          <mat-icon class="error-icon">error</mat-icon>
          <span class="error-text">Upload failed</span>
          <button mat-button class="retry-btn" (click)="onRetry()">Retry</button>
        </div>
      </div>

      <!-- File Input -->
      <input 
        type="file" 
        #fileInput
        accept="image/*"
        (change)="onFileSelected($event)"
        style="display: none"
      >

      <!-- Upload Info -->
      <div class="upload-info" *ngIf="!currentImageUrl">
        <span class="info-text">{{ maxFileSize }}MB max • JPG, PNG, WebP</span>
      </div>
    </div>
  `,
  styles: [`
    .image-upload-container {
      width: 120px;
      position: relative;
    }

    .upload-area {
      width: 120px;
      height: 120px;
      border: 2px dashed #ccc;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      background-color: #fafafa;
      
      &:hover {
        border-color: var(--primary-color);
        background-color: rgba(25, 118, 210, 0.04);
      }
      
      &.drag-over {
        border-color: var(--primary-color);
        background-color: rgba(25, 118, 210, 0.08);
        transform: scale(1.02);
      }
      
      &.has-image {
        border: 2px solid #e0e0e0;
        border-radius: 8px;
        padding: 0;
        background-color: white;
        
        &:hover {
          .image-overlay {
            opacity: 1;
          }
        }
      }
    }

    .image-display {
      position: relative;
      width: 100%;
      height: 100%;
      
      .property-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 6px;
      }
      
      .image-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        opacity: 0;
        transition: opacity 0.3s ease;
        border-radius: 6px;
        
        .overlay-btn {
          background-color: rgba(255, 255, 255, 0.9);
          color: #333;
          width: 32px;
          height: 32px;
          
          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
          }
          
          &:hover {
            background-color: white;
          }
        }
      }
    }

    .upload-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px;
      text-align: center;
      
      .upload-icon {
        font-size: 32px;
        width: 32px;
        height: 32px;
        color: #999;
        margin-bottom: 4px;
      }
      
      .upload-text {
        font-size: 12px;
        font-weight: 500;
        color: #666;
      }
      
      .upload-hint {
        font-size: 10px;
        color: #999;
      }
    }

    .upload-progress {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 8px;
      width: 100%;
      
      .progress-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: var(--primary-color);
        animation: pulse 1.5s ease-in-out infinite;
      }
      
      .progress-text {
        font-size: 11px;
        color: #666;
        font-weight: 500;
      }
      
      mat-progress-bar {
        width: 80px;
        height: 4px;
      }
      
      .progress-percentage {
        font-size: 10px;
        color: #999;
      }
    }

    .upload-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 8px;
      
      .error-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
        color: #f44336;
      }
      
      .error-text {
        font-size: 11px;
        color: #f44336;
        font-weight: 500;
      }
      
      .retry-btn {
        font-size: 10px;
        height: 24px;
        line-height: 24px;
        min-width: 48px;
      }
    }

    .upload-info {
      margin-top: 8px;
      text-align: center;
      
      .info-text {
        font-size: 10px;
        color: #999;
        line-height: 1.2;
      }
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.7;
        transform: scale(1.1);
      }
    }

    // Responsive adjustments
    @media (max-width: 768px) {
      .image-upload-container {
        width: 100px;
      }
      
      .upload-area {
        width: 100px;
        height: 100px;
      }
      
      .upload-placeholder {
        .upload-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }
        
        .upload-text {
          font-size: 11px;
        }
        
        .upload-hint {
          font-size: 9px;
        }
      }
    }
  `]
})
export class ImageUploadComponent {
  @Input() currentImageUrl: string | null = null;
  @Input() imageAlt = 'Property image';
  @Input() maxFileSize = 5; // MB
  @Input() isUploading = false;
  @Input() uploadProgress = 0;
  @Input() uploadError: string | null = null;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() imageRemove = new EventEmitter<void>();
  @Output() uploadRetry = new EventEmitter<void>();

  isDragOver = false;

  onAreaClick() {
    if (this.isUploading) return;
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput?.click();
  }

  onChangeImage(event: Event) {
    event.stopPropagation();
    this.onAreaClick();
  }

  onRemoveImage(event: Event) {
    event.stopPropagation();
    this.imageRemove.emit();
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      if (this.validateFile(file)) {
        this.fileSelected.emit(file);
      }
    }
    
    // Reset input value
    target.value = '';
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this.isUploading) {
      this.isDragOver = true;
    }
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    if (this.isUploading) return;
    
    const files = event.dataTransfer?.files;
    const file = files?.[0];
    
    if (file && this.validateFile(file)) {
      this.fileSelected.emit(file);
    }
  }

  onRetry() {
    this.uploadRetry.emit();
  }

  private validateFile(file: File): boolean {
    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      // In a real app, you'd show a proper error message
      console.error('Invalid file type');
      return false;
    }
    
    // Check file size
    const maxSizeBytes = this.maxFileSize * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      console.error('File too large');
      return false;
    }
    
    return true;
  }
}