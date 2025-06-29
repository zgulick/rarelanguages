import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/management-companies',
    pathMatch: 'full'
  },
  {
    path: 'management-companies',
    loadChildren: () => import('./features/management-company/management-company.routes').then(m => m.managementCompanyRoutes)
  },
  {
    path: '**',
    redirectTo: '/management-companies'
  }
];