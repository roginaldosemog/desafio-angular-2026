import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'contabil' },
  {
    path: 'contabil',
    title: 'Consulta de Lotes · Outros Créditos/Débitos',
    loadComponent: () =>
      import('./features/lotes/pages/consulta-lotes/consulta-lotes').then((m) => m.ConsultaLotes),
  },
  { path: '**', redirectTo: 'contabil' },
];
