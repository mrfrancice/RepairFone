import { Routes } from '@angular/router';
import { repairerGuard, repairerSetupGuard } from './guards/repairer.guard';

export const REPAIRER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/repairer-dashboard/repairer-dashboard.component').then((m) => m.RepairerDashboardComponent),
    title: 'Tableau de bord - RepairFone Pro',
    canActivate: [repairerGuard],
  },
  {
    path: 'profile/setup',
    loadComponent: () =>
      import('./components/repairer-profile-setup/repairer-profile-setup.component').then((m) => m.RepairerProfileSetupComponent),
    title: 'Configuration du profil - RepairFone Pro',
    canActivate: [repairerSetupGuard],
  },
  {
    path: 'requests',
    loadComponent: () =>
      import('./components/request-management/request-management.component').then((m) => m.RequestManagementComponent),
    title: 'Demandes - RepairFone Pro',
    canActivate: [repairerGuard],
  },
  {
    path: 'requests/:id',
    loadComponent: () =>
      import('./components/request-management/request-management.component').then((m) => m.RequestManagementComponent),
    title: 'Détail de la demande - RepairFone Pro',
    canActivate: [repairerGuard],
  },
  {
    path: 'quotes/new',
    loadComponent: () =>
      import('./components/quote-create/quote-create.component').then((m) => m.QuoteCreateComponent),
    title: 'Créer un devis - RepairFone Pro',
    canActivate: [repairerGuard],
  },
];
