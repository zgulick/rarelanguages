import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface Subscription {
  id: string;
  name: string;
  description: string;
  category: 'essential' | 'premium' | 'enterprise' | 'addon';
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  isPopular?: boolean;
  isRecommended?: boolean;
  maxUsers?: number;
  maxProperties?: number;
  included: string[];
  addons: string[];
}

export interface SubscriptionSelection {
  selectedSubscriptionIds: string[];
  estimatedMonthlyCost: number;
  estimatedYearlyCost: number;
}

@Component({
  selector: 'app-subscription-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="subscription-grid">
      <!-- Header Section -->
      <div class="grid-header">
        <h4 class="section-title">Subscription Plans</h4>
        <p class="section-description">
          Select the subscription plans that best fit your management company's needs. 
          You can combine multiple plans and add-ons.
        </p>
      </div>

      <!-- Billing Toggle -->
      <div class="billing-toggle">
        <div class="toggle-container">
          <span class="toggle-label" [class.active]="billingPeriod === 'monthly'">Monthly</span>
          <mat-checkbox 
            [(ngModel)]="isYearly"
            (ngModelChange)="onBillingChange()"
            class="period-toggle">
          </mat-checkbox>
          <span class="toggle-label" [class.active]="billingPeriod === 'yearly'">
            Yearly
            <span class="discount-badge">Save 20%</span>
          </span>
        </div>
      </div>

      <!-- Category Filter -->
      <div class="category-filter">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filter by Category</mat-label>
          <mat-select [(value)]="selectedCategory" (selectionChange)="onCategoryChange()">
            <mat-option value="all">All Categories</mat-option>
            <mat-option value="essential">Essential</mat-option>
            <mat-option value="premium">Premium</mat-option>
            <mat-option value="enterprise">Enterprise</mat-option>
            <mat-option value="addon">Add-ons</mat-option>
          </mat-select>
        </mat-form-field>

        <!-- Selection Summary -->
        <div class="selection-summary">
          <div class="summary-stats">
            <span class="selected-count">{{ selectedSubscriptions.length }} selected</span>
            <span class="total-cost">
              {{ billingPeriod === 'yearly' ? 'Annual' : 'Monthly' }}: 
              <strong>{{ formatCurrency(getCurrentTotal()) }}</strong>
            </span>
          </div>
          <button 
            mat-stroked-button 
            color="primary"
            *ngIf="selectedSubscriptions.length > 0"
            (click)="clearSelection()">
            Clear All
          </button>
        </div>
      </div>

      <!-- Subscription Cards Grid -->
      <div class="subscriptions-grid">
        <div 
          *ngFor="let subscription of filteredSubscriptions" 
          class="subscription-card"
          [class.selected]="isSelected(subscription.id)"
          [class.popular]="subscription.isPopular"
          [class.recommended]="subscription.isRecommended">
          
          <!-- Card Header -->
          <div class="card-header">
            <div class="header-content">
              <div class="selection-checkbox">
                <mat-checkbox 
                  [checked]="isSelected(subscription.id)"
                  (change)="onSubscriptionToggle(subscription, $event.checked)"
                  color="primary">
                </mat-checkbox>
              </div>
              
              <div class="plan-info">
                <h5 class="plan-name">{{ subscription.name }}</h5>
                <span class="plan-category">{{ subscription.category | titlecase }}</span>
              </div>

              <!-- Badges -->
              <div class="plan-badges">
                <span class="popular-badge" *ngIf="subscription.isPopular">Popular</span>
                <span class="recommended-badge" *ngIf="subscription.isRecommended">Recommended</span>
              </div>
            </div>
          </div>

          <!-- Pricing -->
          <div class="card-pricing">
            <div class="price-display">
              <span class="currency">$</span>
              <span class="amount">{{ getCurrentPrice(subscription) }}</span>
              <span class="period">/{{ billingPeriod === 'yearly' ? 'year' : 'month' }}</span>
            </div>
            <div class="price-savings" *ngIf="billingPeriod === 'yearly' && subscription.yearlyPrice < subscription.monthlyPrice * 12">
              Save ${{ (subscription.monthlyPrice * 12 - subscription.yearlyPrice).toFixed(0) }}/year
            </div>
          </div>

          <!-- Description -->
          <div class="card-description">
            <p class="description-text">{{ subscription.description }}</p>
          </div>

          <!-- Limits -->
          <div class="card-limits" *ngIf="subscription.maxUsers || subscription.maxProperties">
            <div class="limit-item" *ngIf="subscription.maxUsers">
              <mat-icon class="limit-icon">people</mat-icon>
              <span>Up to {{ subscription.maxUsers }} users</span>
            </div>
            <div class="limit-item" *ngIf="subscription.maxProperties">
              <mat-icon class="limit-icon">business</mat-icon>
              <span>Up to {{ subscription.maxProperties }} properties</span>
            </div>
          </div>

          <!-- Features -->
          <div class="card-features">
            <h6 class="features-title">Key Features</h6>
            <ul class="features-list">
              <li *ngFor="let feature of subscription.features.slice(0, 4)" class="feature-item">
                <mat-icon class="feature-icon">check</mat-icon>
                <span>{{ feature }}</span>
              </li>
              <li *ngIf="subscription.features.length > 4" class="feature-more">
                <span>+{{ subscription.features.length - 4 }} more features</span>
              </li>
            </ul>
          </div>

          <!-- Included Services -->
          <div class="card-included" *ngIf="subscription.included.length > 0">
            <h6 class="included-title">Included Services</h6>
            <div class="included-chips">
              <mat-chip 
                *ngFor="let service of subscription.included.slice(0, 3)" 
                class="included-chip">
                {{ service }}
              </mat-chip>
              <mat-chip 
                *ngIf="subscription.included.length > 3"
                class="more-chip">
                +{{ subscription.included.length - 3 }} more
              </mat-chip>
            </div>
          </div>

          <!-- Card Actions -->
          <div class="card-actions">
            <button 
              mat-flat-button 
              [color]="isSelected(subscription.id) ? 'warn' : 'primary'"
              (click)="onSubscriptionToggle(subscription, !isSelected(subscription.id))"
              class="action-button">
              {{ isSelected(subscription.id) ? 'Remove' : 'Select Plan' }}
            </button>
            
            <button 
              mat-stroked-button 
              color="primary"
              (click)="viewDetails(subscription)"
              class="details-button">
              View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Cost Breakdown -->
      <div class="cost-breakdown" *ngIf="selectedSubscriptions.length > 0">
        <div class="breakdown-card">
          <h5 class="breakdown-title">Cost Breakdown</h5>
          
          <div class="breakdown-items">
            <div 
              *ngFor="let subscription of getSelectedSubscriptionDetails()" 
              class="breakdown-item">
              <span class="item-name">{{ subscription.name }}</span>
              <span class="item-price">{{ formatCurrency(getCurrentPrice(subscription)) }}</span>
            </div>
          </div>

          <div class="breakdown-total">
            <div class="total-row">
              <span class="total-label">{{ billingPeriod === 'yearly' ? 'Annual' : 'Monthly' }} Total:</span>
              <span class="total-amount">{{ formatCurrency(getCurrentTotal()) }}</span>
            </div>
            <div class="savings-row" *ngIf="billingPeriod === 'yearly' && getYearlySavings() > 0">
              <span class="savings-label">Annual Savings:</span>
              <span class="savings-amount">{{ formatCurrency(getYearlySavings()) }}</span>
            </div>
          </div>

          <div class="breakdown-actions">
            <button 
              mat-flat-button 
              color="primary"
              (click)="proceedWithSelection()"
              [disabled]="selectedSubscriptions.length === 0">
              Proceed with Selection
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="filteredSubscriptions.length === 0">
        <mat-icon class="empty-icon">search_off</mat-icon>
        <h6 class="empty-title">No subscriptions found</h6>
        <p class="empty-description">
          Try adjusting your category filter or check back later for more options.
        </p>
      </div>
    </div>
  `,
  styleUrls: ['./subscription-grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionGridComponent implements OnInit {
  @Input() initialSelection: SubscriptionSelection | null = null;
  @Output() selectionChange = new EventEmitter<SubscriptionSelection>();

  selectedSubscriptions: string[] = [];
  billingPeriod: 'monthly' | 'yearly' = 'monthly';
  isYearly = false;
  selectedCategory = 'all';

  availableSubscriptions: Subscription[] = [
    {
      id: 'sub-essential-basic',
      name: 'Essential Basic',
      description: 'Perfect for small property management companies starting their digital journey.',
      category: 'essential',
      monthlyPrice: 49,
      yearlyPrice: 470,
      isPopular: true,
      maxUsers: 5,
      maxProperties: 25,
      features: [
        'Property management dashboard',
        'Tenant communication tools',
        'Basic rent collection',
        'Maintenance request tracking',
        'Document storage (5GB)',
        'Email support'
      ],
      included: ['Basic Analytics', 'Mobile App', 'Cloud Storage'],
      addons: ['SMS Notifications', 'Advanced Reports']
    },
    {
      id: 'sub-essential-pro',
      name: 'Essential Pro',
      description: 'Enhanced features for growing property management businesses.',
      category: 'essential',
      monthlyPrice: 89,
      yearlyPrice: 854,
      maxUsers: 15,
      maxProperties: 100,
      features: [
        'All Essential Basic features',
        'Advanced rent collection',
        'Automated late fee calculations',
        'Tenant screening integration',
        'Document storage (25GB)',
        'Priority email support',
        'Custom lease templates',
        'Financial reporting'
      ],
      included: ['Advanced Analytics', 'API Access', 'Mobile App', 'Cloud Storage'],
      addons: ['White Label', 'Custom Integrations']
    },
    {
      id: 'sub-premium-standard',
      name: 'Premium Standard',
      description: 'Comprehensive solution for established property management companies.',
      category: 'premium',
      monthlyPrice: 149,
      yearlyPrice: 1430,
      isRecommended: true,
      maxUsers: 50,
      maxProperties: 500,
      features: [
        'All Essential Pro features',
        'Multi-property management',
        'Advanced accounting integration',
        'Custom workflows',
        'Document storage (100GB)',
        'Phone support',
        'Marketing tools',
        'Vendor management',
        'Advanced tenant portal'
      ],
      included: ['Premium Analytics', 'API Access', 'Mobile App', 'Cloud Storage', 'Training'],
      addons: ['Marketing Automation', 'Advanced Integrations']
    },
    {
      id: 'sub-premium-plus',
      name: 'Premium Plus',
      description: 'Advanced features for large-scale property management operations.',
      category: 'premium',
      monthlyPrice: 249,
      yearlyPrice: 2390,
      maxUsers: 100,
      maxProperties: 1000,
      features: [
        'All Premium Standard features',
        'Multi-location support',
        'Advanced automation rules',
        'Custom integrations',
        'Document storage (500GB)',
        'Dedicated account manager',
        'White-label options',
        'Advanced security features',
        'Custom reporting engine'
      ],
      included: ['Enterprise Analytics', 'Full API Access', 'Mobile App', 'Cloud Storage', 'Training', 'Onboarding'],
      addons: ['Custom Development', 'Enterprise Security']
    },
    {
      id: 'sub-enterprise-core',
      name: 'Enterprise Core',
      description: 'Enterprise-grade solution for large property management companies.',
      category: 'enterprise',
      monthlyPrice: 399,
      yearlyPrice: 3830,
      maxUsers: 250,
      maxProperties: 2500,
      features: [
        'All Premium Plus features',
        'Enterprise-grade security',
        'Custom development support',
        'Advanced workflow automation',
        'Unlimited document storage',
        '24/7 phone support',
        'Multi-tenant architecture',
        'Advanced role management',
        'Compliance management tools'
      ],
      included: ['Enterprise Analytics', 'Full API Access', 'Mobile App', 'Cloud Storage', 'Training', 'Onboarding', 'Compliance Tools'],
      addons: ['Custom Features', 'Dedicated Infrastructure']
    },
    {
      id: 'addon-sms',
      name: 'SMS Notifications',
      description: 'Send automated SMS notifications to tenants and property owners.',
      category: 'addon',
      monthlyPrice: 19,
      yearlyPrice: 182,
      features: [
        'Automated SMS notifications',
        'Custom message templates',
        'Delivery tracking',
        'International SMS support'
      ],
      included: ['Message Analytics'],
      addons: []
    },
    {
      id: 'addon-marketing',
      name: 'Marketing Automation',
      description: 'Automated marketing campaigns for property promotion and tenant retention.',
      category: 'addon',
      monthlyPrice: 39,
      yearlyPrice: 374,
      features: [
        'Email marketing campaigns',
        'Social media integration',
        'Lead scoring',
        'Campaign analytics',
        'A/B testing'
      ],
      included: ['Marketing Analytics', 'Social Media Tools'],
      addons: []
    },
    {
      id: 'addon-advanced-reports',
      name: 'Advanced Reporting',
      description: 'Detailed analytics and custom reporting capabilities.',
      category: 'addon',
      monthlyPrice: 29,
      yearlyPrice: 278,
      features: [
        'Custom report builder',
        'Advanced analytics',
        'Data visualization',
        'Scheduled reports',
        'Export to multiple formats'
      ],
      included: ['Data Export Tools'],
      addons: []
    }
  ];

  get filteredSubscriptions(): Subscription[] {
    if (this.selectedCategory === 'all') {
      return this.availableSubscriptions;
    }
    return this.availableSubscriptions.filter(sub => sub.category === this.selectedCategory);
  }

  constructor(private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    if (this.initialSelection) {
      this.selectedSubscriptions = [...this.initialSelection.selectedSubscriptionIds];
    }
  }

  onBillingChange(): void {
    this.billingPeriod = this.isYearly ? 'yearly' : 'monthly';
    this.emitSelectionChange();
  }

  onCategoryChange(): void {
    // Category filtering is handled by the filteredSubscriptions getter
  }

  onSubscriptionToggle(subscription: Subscription, isSelected: boolean): void {
    if (isSelected) {
      if (!this.selectedSubscriptions.includes(subscription.id)) {
        this.selectedSubscriptions.push(subscription.id);
      }
    } else {
      this.selectedSubscriptions = this.selectedSubscriptions.filter(id => id !== subscription.id);
    }
    
    this.emitSelectionChange();
    
    const action = isSelected ? 'added to' : 'removed from';
    this.snackBar.open(`${subscription.name} ${action} selection`, 'Close', {
      duration: 2000
    });
  }

  isSelected(subscriptionId: string): boolean {
    return this.selectedSubscriptions.includes(subscriptionId);
  }

  clearSelection(): void {
    this.selectedSubscriptions = [];
    this.emitSelectionChange();
    
    this.snackBar.open('All subscriptions removed from selection', 'Close', {
      duration: 2000
    });
  }

  getCurrentPrice(subscription: Subscription): number {
    return this.billingPeriod === 'yearly' ? subscription.yearlyPrice : subscription.monthlyPrice;
  }

  getCurrentTotal(): number {
    return this.selectedSubscriptions.reduce((total, id) => {
      const subscription = this.availableSubscriptions.find(sub => sub.id === id);
      return total + (subscription ? this.getCurrentPrice(subscription) : 0);
    }, 0);
  }

  getYearlySavings(): number {
    if (this.billingPeriod !== 'yearly') return 0;
    
    return this.selectedSubscriptions.reduce((savings, id) => {
      const subscription = this.availableSubscriptions.find(sub => sub.id === id);
      if (subscription) {
        const monthlyCost = subscription.monthlyPrice * 12;
        const yearlyCost = subscription.yearlyPrice;
        return savings + (monthlyCost - yearlyCost);
      }
      return savings;
    }, 0);
  }

  getSelectedSubscriptionDetails(): Subscription[] {
    return this.selectedSubscriptions
      .map(id => this.availableSubscriptions.find(sub => sub.id === id))
      .filter((sub): sub is Subscription => !!sub);
  }

  viewDetails(subscription: Subscription): void {
    // In a real implementation, this would open a details modal
    this.snackBar.open(`Details for ${subscription.name} would open in a modal`, 'Close', {
      duration: 3000
    });
  }

  proceedWithSelection(): void {
    if (this.selectedSubscriptions.length === 0) return;
    
    this.snackBar.open('Proceeding with subscription selection...', 'Close', {
      duration: 2000,
      panelClass: ['success-snackbar']
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  private emitSelectionChange(): void {
    const selection: SubscriptionSelection = {
      selectedSubscriptionIds: [...this.selectedSubscriptions],
      estimatedMonthlyCost: this.billingPeriod === 'monthly' ? this.getCurrentTotal() : Math.round(this.getCurrentTotal() / 12),
      estimatedYearlyCost: this.billingPeriod === 'yearly' ? this.getCurrentTotal() : this.getCurrentTotal() * 12
    };
    
    this.selectionChange.emit(selection);
  }
}