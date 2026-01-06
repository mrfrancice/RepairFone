import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const DISPUTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dispute-list/dispute-list.component').then((m) => m.DisputeListComponent),
    title: 'Mes litiges - RepairFone',
    canActivate: [authGuard],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/dispute-create/dispute-create.component').then((m) => m.DisputeCreateComponent),
    title: 'Signaler un problème - RepairFone',
    canActivate: [authGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/dispute-detail/dispute-detail.component').then((m) => m.DisputeDetailComponent),
    title: 'Détail du litige - RepairFone',
    canActivate: [authGuard],
  },
];
