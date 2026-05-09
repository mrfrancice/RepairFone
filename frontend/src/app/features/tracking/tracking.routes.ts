import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const TRACKING_ROUTES: Routes = [
  {
    path: ':requestId',
    loadComponent: () =>
      import('./components/tracking-view/tracking-view.component').then((m) => m.TrackingViewComponent),
    canActivate: [authGuard],
    title: 'Suivi en temps réel - RepairFone',
  },
];
