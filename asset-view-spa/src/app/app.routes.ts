import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/asset-view',
    pathMatch: 'full'
  },
  {
    path: 'asset-view',
    loadComponent: () => import('./features/asset-view/asset-view-main.component').then(m => m.AssetViewMainComponent)
  },
  {
    path: '**',
    redirectTo: '/asset-view'
  }
];
