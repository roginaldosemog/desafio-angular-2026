import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { criarFiltros } from '../testing/fabricas';
import { LotesApi } from './lotes-api';
import { ATRASO_SIMULADO_MS, LotesApiMock } from './lotes-api-mock';
import { LOTES_MOCK } from './mock/lotes.mock';

describe('LotesApiMock', () => {
  function configurar(atrasoMs = 0): LotesApi {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ATRASO_SIMULADO_MS, useValue: atrasoMs },
        { provide: LotesApi, useClass: LotesApiMock },
      ],
    });
    return TestBed.inject(LotesApi);
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('pesquisar', () => {
    it('CL-06: devolve a página pedida com o total de lotes encontrados', async () => {
      const api = configurar();

      const pagina = await firstValueFrom(api.pesquisar(criarFiltros(), 1, 10));

      expect(pagina.itens.map((lote) => lote.id)).toEqual(LOTES_MOCK.slice(0, 10).map((l) => l.id));
      expect(pagina.total).toBe(LOTES_MOCK.length);
    });

    it('CL-06: aplica os filtros antes de paginar', async () => {
      const api = configurar();
      const enviados = LOTES_MOCK.filter((lote) => lote.situacao === 'ENVIADO');

      const pagina = await firstValueFrom(
        api.pesquisar(criarFiltros({ situacao: 'ENVIADO' }), 1, 10),
      );

      expect(pagina.itens.every((lote) => lote.situacao === 'ENVIADO')).toBe(true);
      expect(pagina.total).toBe(enviados.length);
    });

    it('CL-08: responde só depois do atraso simulado (of + delay)', () => {
      vi.useFakeTimers();
      const api = configurar(600);
      const respostas: unknown[] = [];

      api.pesquisar(criarFiltros(), 1, 10).subscribe((pagina) => respostas.push(pagina));

      vi.advanceTimersByTime(599);
      expect(respostas).toHaveLength(0);

      vi.advanceTimersByTime(1);
      expect(respostas).toHaveLength(1);
    });
  });

  describe('falha simulada', () => {
    it('CL-09: falha quando a URL tem ?simularErro=true', async () => {
      const api = configurar();
      await TestBed.inject(Router).navigateByUrl('/?simularErro=true');

      await expect(firstValueFrom(api.pesquisar(criarFiltros(), 1, 10))).rejects.toThrow(
        /simulada/i,
      );
    });

    it('CL-09: volta a responder quando o parâmetro sai da URL', async () => {
      const api = configurar();
      const router = TestBed.inject(Router);
      await router.navigateByUrl('/?simularErro=true');
      await expect(firstValueFrom(api.pesquisar(criarFiltros(), 1, 10))).rejects.toThrow();

      await router.navigateByUrl('/');

      await expect(firstValueFrom(api.pesquisar(criarFiltros(), 1, 10))).resolves.toBeDefined();
    });
  });
});
