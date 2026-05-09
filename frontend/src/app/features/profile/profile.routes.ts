import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/profile-view/profile-view.component').then((m) => m.ProfileViewComponent),
    canActivate: [authGuard],
    title: 'Mon profil - RepairFone',
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./components/profile-edit/profile-edit.component').then((m) => m.ProfileEditComponent),
    canActivate: [authGuard],
    title: 'Modifier mon profil - RepairFone',
  },
];
