import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/payment-history/payment-history.component').then((m) => m.PaymentHistoryComponent),
    title: 'Mes paiements - RepairFone',
    canActivate: [authGuard],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/payment-summary/payment-summary.component').then((m) => m.PaymentSummaryComponent),
    title: 'Paiement - RepairFone',
    canActivate: [authGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/payment-detail/payment-detail.component').then((m) => m.PaymentDetailComponent),
    title: 'Détail du paiement - RepairFone',
    canActivate: [authGuard],
  },
];
