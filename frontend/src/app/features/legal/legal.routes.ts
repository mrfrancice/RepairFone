import { Routes } from '@angular/router';

export const LEGAL_ROUTES: Routes = [
  {
    path: 'terms',
    loadComponent: () =>
      import('./components/terms/terms.component').then((m) => m.TermsComponent),
    title: "Conditions d'utilisation - RepairFone",
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./components/privacy/privacy.component').then((m) => m.PrivacyComponent),
    title: 'Politique de confidentialité - RepairFone',
  },
  {
    path: 'legal-notice',
    loadComponent: () =>
      import('./components/legal-notice/legal-notice.component').then((m) => m.LegalNoticeComponent),
    title: 'Mentions légales - RepairFone',
  },
  {
    path: 'repairer-terms',
    loadComponent: () =>
      import('./components/repairer-terms/repairer-terms.component').then(
        (m) => m.RepairerTermsComponent,
      ),
    title: 'Charte des réparateurs - RepairFone',
  },
];
