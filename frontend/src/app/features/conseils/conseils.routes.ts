import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const CONSEILS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/conseil-type/conseil-type.component').then(
        (m) => m.ConseilTypeComponent
      ),
    title: 'Conseils - RepairFone',
  },
  {
    path: 'experts',
    loadComponent: () =>
      import('./components/expert-list/expert-list.component').then(
        (m) => m.ExpertListComponent
      ),
    title: 'Nos Experts - RepairFone',
  },
  {
    path: 'expert/:id',
    loadComponent: () =>
      import('./components/expert-detail/expert-detail.component').then(
        (m) => m.ExpertDetailComponent
      ),
    title: 'Expert - RepairFone',
  },
  {
    path: 'chat/:sessionId',
    loadComponent: () =>
      import('./components/conseil-chat/conseil-chat.component').then(
        (m) => m.ConseilChatComponent
      ),
    canActivate: [authGuard],
    title: 'Session Conseil - RepairFone',
  },
  {
    path: 'sessions',
    loadComponent: () =>
      import('./components/conseil-sessions/conseil-sessions.component').then(
        (m) => m.ConseilSessionsComponent
      ),
    canActivate: [authGuard],
    title: 'Mes Sessions - RepairFone',
  },
];
