import { Routes } from '@angular/router';

export const ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/onboarding-slides/onboarding-slides.component').then(
        (m) => m.OnboardingSlidesComponent
      ),
    title: 'Bienvenue - RepairFone',
  },
];
