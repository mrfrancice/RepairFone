import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const REQUESTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/request-list/request-list.component').then((m) => m.RequestListComponent),
    canActivate: [authGuard],
    title: 'Mes demandes - RepairFone',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/new-request/new-request.component').then((m) => m.NewRequestComponent),
    canActivate: [authGuard],
    title: 'Nouvelle demande - RepairFone',
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/request-detail/request-detail.component').then((m) => m.RequestDetailComponent),
    canActivate: [authGuard],
    title: 'Détails de la demande - RepairFone',
  },
];
