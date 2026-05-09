import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const REVIEWS_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'my',
    pathMatch: 'full',
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./components/new-review/new-review.component').then((m) => m.NewReviewComponent),
    canActivate: [authGuard],
    title: 'Laisser un avis - RepairFone',
  },
  {
    path: 'my',
    loadComponent: () =>
      import('./components/my-reviews/my-reviews.component').then((m) => m.MyReviewsComponent),
    canActivate: [authGuard],
    title: 'Mes avis - RepairFone',
  },
];
