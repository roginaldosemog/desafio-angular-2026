import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'contabil' },
  {
    path: 'contabil',
    loadChildren: () => import('./features/lotes/lotes.routes').then((m) => m.LOTES_ROUTES),
  },
  { path: '**', redirectTo: 'contabil' },
];
