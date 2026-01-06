import { Routes } from '@angular/router';

export const NOTIFICATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/notification-list/notification-list.component').then(
        (m) => m.NotificationListComponent
      ),
    title: 'Notifications - RepairFone',
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./components/notification-settings/notification-settings.component').then(
        (m) => m.NotificationSettingsComponent
      ),
    title: 'Préférences de notification - RepairFone',
  },
];
