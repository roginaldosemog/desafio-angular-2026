import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { criarFiltros } from '../testing/fabricas';
import { LotesApi } from './lotes-api';
import { LotesApiMock } from './lotes-api-mock';
import { LOTES_MOCK } from './mock/lotes.mock';
import { ATRASO_SIMULADO_MS, ServidorSimulado } from './mock/servidor-simulado';

describe('LotesApiMock', () => {
  let api: LotesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ServidorSimulado,
        { provide: ATRASO_SIMULADO_MS, useValue: 0 },
        { provide: LotesApi, useClass: LotesApiMock },
      ],
    });
    api = TestBed.inject(LotesApi);
  });

  it('CL-06: devolve a página pedida com o total de lotes encontrados', async () => {
    const pagina = await firstValueFrom(api.pesquisar(criarFiltros(), 1, 10));

    expect(pagina.itens.map((lote) => lote.id)).toEqual(LOTES_MOCK.slice(0, 10).map((l) => l.id));
    expect(pagina.total).toBe(LOTES_MOCK.length);
  });

  it('CL-06: aplica os filtros antes de paginar', async () => {
    const enviados = LOTES_MOCK.filter((lote) => lote.situacao === 'ENVIADO');

    const pagina = await firstValueFrom(
      api.pesquisar(criarFiltros({ situacao: 'ENVIADO' }), 1, 10),
    );

    expect(pagina.itens.every((lote) => lote.situacao === 'ENVIADO')).toBe(true);
    expect(pagina.total).toBe(enviados.length);
  });
});
