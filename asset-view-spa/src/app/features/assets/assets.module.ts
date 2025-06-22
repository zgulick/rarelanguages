/**
 * Assets Feature Module - Lazy Loaded
 * Demonstrates enterprise module organization and lazy loading patterns
 */

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

// Angular Material imports
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule } from '@angular/material/snack-bar';

// Feature components - using OnPush change detection
import { AssetListComponent } from './components/asset-list/asset-list.component';
import { AssetDetailComponent } from './components/asset-detail/asset-detail.component';
import { AssetFiltersComponent } from './components/asset-filters/asset-filters.component';
import { AssetSearchComponent } from './components/asset-search/asset-search.component';
import { AssetCardComponent } from './components/asset-card/asset-card.component';
import { AssetStatsComponent } from './components/asset-stats/asset-stats.component';

// Shared components
import { SharedModule } from '../../shared/shared.module';

// Routes with lazy loading and guards
const routes: Routes = [
  {
    path: '',
    component: AssetListComponent,
    data: { 
      title: 'Assets',
      breadcrumb: 'Assets',
      preload: true // Enterprise preloading strategy
    }
  },
  {
    path: 'search',
    component: AssetSearchComponent,
    data: { 
      title: 'Asset Search',
      breadcrumb: 'Search' 
    }
  },
  {
    path: ':id',
    component: AssetDetailComponent,
    data: { 
      title: 'Asset Details',
      breadcrumb: 'Details'
    }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./components/asset-edit/asset-edit.component')
      .then(c => c.AssetEditComponent),
    data: { 
      title: 'Edit Asset',
      breadcrumb: 'Edit',
      requiresAuth: true
    }
  }
];

@NgModule({
  declarations: [
    AssetListComponent,
    AssetDetailComponent,
    AssetFiltersComponent,
    AssetSearchComponent,
    AssetCardComponent,
    AssetStatsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    
    // Angular Material - only import what we need for performance
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSliderModule,
    MatCheckboxModule,
    MatMenuModule,
    MatTooltipModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule,
    
    // Shared module for common components
    SharedModule
  ],
  providers: [
    // Feature-specific providers can go here
  ]
})
export class AssetsModule {
  constructor() {
    console.log('🚀 Assets Module loaded (lazy loaded for performance)');
  }
}