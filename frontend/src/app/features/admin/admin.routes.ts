import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
  },
  {
    path: 'repairers',
    loadComponent: () =>
      import('./components/repairers-verification/repairers-verification.component').then(
        (m) => m.RepairersVerificationComponent
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./components/users-management/users-management.component').then(
        (m) => m.UsersManagementComponent
      ),
  },
  {
    path: 'payments',
    loadComponent: () =>
      import('./components/payments-admin/payments-admin.component').then(
        (m) => m.PaymentsAdminComponent
      ),
  },
  {
    path: 'disputes',
    loadComponent: () =>
      import('./components/disputes-admin/disputes-admin.component').then(
        (m) => m.DisputesAdminComponent
      ),
  },
];
