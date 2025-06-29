import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { trigger, state, style, transition, animate } from '@angular/animations';

export interface StepConfig {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  isValid?: boolean;
  isCompleted?: boolean;
  isOptional?: boolean;
}

@Component({
  selector: 'app-custom-stepper',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatCardModule],
  template: `
    <div class="custom-stepper">
      <!-- Progress Header -->
      <div class="stepper-header">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            [style.width.%]="progressPercentage">
          </div>
        </div>
        
        <div class="steps-indicator">
          <div 
            *ngFor="let step of steps; let i = index"
            class="step-indicator"
            [class.active]="i === currentStep"
            [class.completed]="step.isCompleted"
            [class.clickable]="i < currentStep || step.isCompleted"
            (click)="onStepClick(i)">
            
            <div class="step-circle">
              <mat-icon *ngIf="step.isCompleted">check</mat-icon>
              <mat-icon *ngIf="!step.isCompleted && step.icon">{{ step.icon }}</mat-icon>
              <span *ngIf="!step.isCompleted && !step.icon">{{ i + 1 }}</span>
            </div>
            
            <div class="step-label">
              <span class="step-title">{{ step.label }}</span>
              <span class="step-description" *ngIf="step.description">{{ step.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Step Content -->
      <div class="stepper-content">
        <div 
          *ngFor="let step of steps; let i = index"
          class="step-content"
          [class.active]="i === currentStep"
          [@slideAnimation]="i === currentStep ? 'expanded' : 'collapsed'">
          
          <mat-card *ngIf="i === currentStep" class="step-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon *ngIf="step.icon" class="step-icon">{{ step.icon }}</mat-icon>
                {{ step.label }}
                <span *ngIf="step.isOptional" class="optional-badge">Optional</span>
              </mat-card-title>
              <mat-card-subtitle *ngIf="step.description">
                {{ step.description }}
              </mat-card-subtitle>
            </mat-card-header>
            
            <mat-card-content>
              <ng-content [select]="'[step-' + i + ']'"></ng-content>
            </mat-card-content>
            
            <mat-card-actions class="step-actions">
              <button 
                mat-button 
                [disabled]="currentStep === 0"
                (click)="previousStep()">
                <mat-icon>arrow_back</mat-icon>
                Previous
              </button>
              
              <div class="spacer"></div>
              
              <button 
                *ngIf="currentStep < steps.length - 1"
                mat-raised-button 
                color="primary"
                [disabled]="!canProceed()"
                (click)="nextStep()">
                Next
                <mat-icon>arrow_forward</mat-icon>
              </button>
              
              <button 
                *ngIf="currentStep === steps.length - 1"
                mat-raised-button 
                color="primary"
                [disabled]="!canFinish()"
                (click)="finish()">
                <mat-icon>check</mat-icon>
                Save & Finish
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./custom-stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('slideAnimation', [
      state('expanded', style({
        opacity: 1,
        transform: 'translateX(0)',
        maxHeight: '*'
      })),
      state('collapsed', style({
        opacity: 0,
        transform: 'translateX(-20px)',
        maxHeight: '0',
        overflow: 'hidden'
      })),
      transition('collapsed => expanded', [
        animate('300ms ease-in-out')
      ]),
      transition('expanded => collapsed', [
        animate('200ms ease-in-out')
      ])
    ])
  ]
})
export class CustomStepperComponent implements OnInit {
  @Input() steps: StepConfig[] = [];
  @Input() currentStep: number = 0;
  @Input() linear: boolean = true;
  @Input() allowStepNavigation: boolean = true;

  @Output() stepChange = new EventEmitter<number>();
  @Output() stepClick = new EventEmitter<number>();
  @Output() complete = new EventEmitter<void>();

  get progressPercentage(): number {
    if (this.steps.length === 0) return 0;
    return ((this.currentStep + 1) / this.steps.length) * 100;
  }

  ngOnInit(): void {
    // Initialize step completion states if not provided
    this.steps.forEach((step, index) => {
      if (step.isCompleted === undefined) {
        step.isCompleted = index < this.currentStep;
      }
      if (step.isValid === undefined) {
        step.isValid = true;
      }
    });
  }

  onStepClick(stepIndex: number): void {
    if (!this.allowStepNavigation) return;
    
    // Allow navigation to previous steps or completed steps
    if (stepIndex < this.currentStep || this.steps[stepIndex].isCompleted) {
      this.goToStep(stepIndex);
      this.stepClick.emit(stepIndex);
    }
  }

  nextStep(): void {
    if (this.canProceed() && this.currentStep < this.steps.length - 1) {
      // Mark current step as completed
      this.steps[this.currentStep].isCompleted = true;
      
      this.currentStep++;
      this.stepChange.emit(this.currentStep);
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.stepChange.emit(this.currentStep);
    }
  }

  goToStep(stepIndex: number): void {
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      this.currentStep = stepIndex;
      this.stepChange.emit(this.currentStep);
    }
  }

  finish(): void {
    if (this.canFinish()) {
      // Mark all steps as completed
      this.steps.forEach(step => step.isCompleted = true);
      this.complete.emit();
    }
  }

  canProceed(): boolean {
    const currentStepConfig = this.steps[this.currentStep];
    return currentStepConfig?.isValid !== false;
  }

  canFinish(): boolean {
    // Check if all required steps are valid
    return this.steps.every(step => 
      step.isOptional || step.isValid !== false
    );
  }

  // Public method to update step validity
  updateStepValidity(stepIndex: number, isValid: boolean): void {
    if (this.steps[stepIndex]) {
      this.steps[stepIndex].isValid = isValid;
    }
  }

  // Public method to mark step as completed
  markStepCompleted(stepIndex: number, isCompleted: boolean = true): void {
    if (this.steps[stepIndex]) {
      this.steps[stepIndex].isCompleted = isCompleted;
    }
  }
}