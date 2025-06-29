import { Routes } from '@angular/router';

export const managementCompanyRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/management-company-list/management-company-list.component')
      .then(m => m.ManagementCompanyListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./components/management-company-create/management-company-create.component')
      .then(m => m.ManagementCompanyCreateComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/management-company-edit/management-company-edit.component')
      .then(m => m.ManagementCompanyEditComponent)
  }
];