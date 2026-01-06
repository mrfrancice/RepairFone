import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const QUOTES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/quote-list/quote-list.component').then((m) => m.QuoteListComponent),
    title: 'Mes devis - RepairFone',
    canActivate: [authGuard],
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/quote-detail/quote-detail.component').then((m) => m.QuoteDetailComponent),
    title: 'Détail du devis - RepairFone',
    canActivate: [authGuard],
  },
];
