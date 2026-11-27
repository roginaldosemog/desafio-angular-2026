import { Routes } from '@angular/router';
import { LotesApi } from './data-access/lotes-api';
import { LotesApiMock } from './data-access/lotes-api-mock';
import { ConsultaLotes } from './pages/consulta-lotes/consulta-lotes';

/**
 * Rotas da funcionalidade de lotes, carregadas sob demanda pelo `app.routes.ts`.
 * O provider fica na rota: a API e os dados mock só são baixados ao abrir /contabil.
 */
export const LOTES_ROUTES: Routes = [
  {
    path: '',
    title: 'Consulta de Lotes · Outros Créditos/Débitos',
    providers: [{ provide: LotesApi, useClass: LotesApiMock }],
    component: ConsultaLotes,
  },
];
