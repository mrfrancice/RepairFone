import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    title: 'Administration - RepairFone',
    loadComponent: () =>
      import('./components/dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent
      ),
  },
  {
    path: 'repairers',
    title: 'Réparateurs - Admin RepairFone',
    loadComponent: () =>
      import('./components/repairers-verification/repairers-verification.component').then(
        (m) => m.RepairersVerificationComponent
      ),
  },
  {
    path: 'users',
    title: 'Utilisateurs - Admin RepairFone',
    loadComponent: () =>
      import('./components/users-management/users-management.component').then(
        (m) => m.UsersManagementComponent
      ),
  },
  {
    path: 'payments',
    title: 'Audit des paiements - Admin RepairFone',
    loadComponent: () =>
      import('./components/payments-admin/payments-admin.component').then(
        (m) => m.PaymentsAdminComponent
      ),
  },
  {
    path: 'disputes',
    title: 'Audit des litiges - Admin RepairFone',
    loadComponent: () =>
      import('./components/disputes-admin/disputes-admin.component').then(
        (m) => m.DisputesAdminComponent
      ),
  },
];
