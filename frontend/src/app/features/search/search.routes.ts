import { Routes } from '@angular/router';

export const SEARCH_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/search-home/search-home.component').then((m) => m.SearchHomeComponent),
    title: 'Rechercher un réparateur - FastRepair',
  },
  {
    path: 'results',
    loadComponent: () =>
      import('./components/search-results/search-results.component').then((m) => m.SearchResultsComponent),
    title: 'Résultats de recherche - FastRepair',
  },
  {
    path: 'compare',
    loadComponent: () =>
      import('./components/compare-repairers/compare-repairers.component').then((m) => m.CompareRepairersComponent),
    title: 'Comparer les réparateurs - FastRepair',
  },
  {
    path: 'repairer/:id',
    loadComponent: () =>
      import('./components/repairer-detail/repairer-detail.component').then((m) => m.RepairerDetailComponent),
    title: 'Profil réparateur - FastRepair',
  },
];
