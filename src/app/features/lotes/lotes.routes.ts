import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { Routes } from '@angular/router';
import { provideDatasPtBr } from '../../shared/datas/datas-pt-br';
import { CadastrosApi } from './data-access/cadastros-api';
import { CadastrosApiMock } from './data-access/cadastros-api-mock';
import { LancamentosApi } from './data-access/lancamentos-api';
import { LancamentosApiMock } from './data-access/lancamentos-api-mock';
import { LotesApi } from './data-access/lotes-api';
import { LotesApiMock } from './data-access/lotes-api-mock';
import { BancoEmMemoria } from './data-access/mock/banco-em-memoria';
import { ServidorSimulado } from './data-access/mock/servidor-simulado';
import { ConsultaLotes } from './pages/consulta-lotes/consulta-lotes';

/**
 * Rotas da funcionalidade de lotes, carregadas sob demanda pelo `app.routes.ts`.
 * Os providers ficam na rota: APIs, dados mock, datepicker e campos só são baixados ao abrir
 * /contabil, fora do bundle inicial.
 */
export const LOTES_ROUTES: Routes = [
  {
    path: '',
    title: 'Consulta de Lotes · Outros Créditos/Débitos',
    providers: [
      ServidorSimulado,
      BancoEmMemoria,
      { provide: LotesApi, useClass: LotesApiMock },
      { provide: LancamentosApi, useClass: LancamentosApiMock },
      { provide: CadastrosApi, useClass: CadastrosApiMock },
      // Datepicker lê e exibe dd/mm/aaaa, com textos em português.
      provideDatasPtBr(),
      // Campos com contorno; o espaço da mensagem de erro só aparece quando há erro.
      {
        provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
        useValue: { appearance: 'outline', subscriptSizing: 'dynamic' },
      },
    ],
    component: ConsultaLotes,
  },
];
