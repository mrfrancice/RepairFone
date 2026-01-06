import { Routes } from '@angular/router';
import { authGuard, adminGuard, noAdminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
  {
    path: 'onboarding',
    loadChildren: () => import('./features/onboarding/onboarding.routes').then((m) => m.ONBOARDING_ROUTES),
    canActivate: [noAdminGuard],
  },
  {
    path: 'home',
    loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
    canActivate: [noAdminGuard],
  },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: 'search',
    loadChildren: () => import('./features/search/search.routes').then((m) => m.SEARCH_ROUTES),
    canActivate: [noAdminGuard],
  },
  {
    path: 'conseils',
    loadChildren: () => import('./features/conseils/conseils.routes').then((m) => m.CONSEILS_ROUTES),
    canActivate: [noAdminGuard],
  },
  {
    path: 'requests',
    loadChildren: () => import('./features/requests/requests.routes').then((m) => m.REQUESTS_ROUTES),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'tracking',
    loadChildren: () => import('./features/tracking/tracking.routes').then((m) => m.TRACKING_ROUTES),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
    canActivate: [authGuard],
  },
  {
    path: 'reviews',
    loadChildren: () => import('./features/reviews/reviews.routes').then((m) => m.REVIEWS_ROUTES),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'quotes',
    loadChildren: () => import('./features/quotes/quotes.routes').then((m) => m.QUOTES_ROUTES),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'payment',
    loadChildren: () => import('./features/payment/payment.routes').then((m) => m.PAYMENT_ROUTES),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'disputes',
    loadChildren: () => import('./features/disputes/disputes.routes').then((m) => m.DISPUTES_ROUTES),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'repairer',
    loadChildren: () => import('./features/repairer/repairer.routes').then((m) => m.REPAIRER_ROUTES),
    canActivate: [noAdminGuard],
  },
  {
    path: 'chat',
    loadChildren: () => import('./features/chat/chat.routes').then((m) => m.CHAT_ROUTES),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'notifications',
    loadChildren: () => import('./features/notifications/notifications.routes').then((m) => m.NOTIFICATIONS_ROUTES),
    canActivate: [authGuard, noAdminGuard],
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [adminGuard],
  },
  {
    path: '**',
    redirectTo: 'onboarding',
  },
];
