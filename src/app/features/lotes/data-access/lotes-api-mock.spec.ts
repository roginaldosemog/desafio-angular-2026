import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { Lote } from '../models/lote';
import { criarFiltros } from '../testing/fabricas';
import { LotesApi } from './lotes-api';
import { LotesApiMock } from './lotes-api-mock';
import { USUARIO_LOGADO } from './mock/cadastros.mock';
import { LOTES_MOCK } from './mock/lotes.mock';
import { ATRASO_SIMULADO_MS, RELOGIO_SIMULADO, ServidorSimulado } from './mock/servidor-simulado';

/** Relógio fixo: a data/hora da situação fica previsível no teste. */
const AGORA = new Date(2026, 5, 1, 14, 30, 0);

describe('LotesApiMock', () => {
  let api: LotesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ServidorSimulado,
        { provide: ATRASO_SIMULADO_MS, useValue: 0 },
        { provide: RELOGIO_SIMULADO, useValue: () => AGORA },
        { provide: LotesApi, useClass: LotesApiMock },
      ],
    });
    api = TestBed.inject(LotesApi);
  });

  /** Lê um lote do estado atual da API, pela própria pesquisa. */
  async function lote(id: number): Promise<Lote | undefined> {
    const filtros = criarFiltros({ idLote: { de: id, ate: id } });
    const pagina = await firstValueFrom(api.pesquisar(filtros, 1, 10));
    return pagina.itens[0];
  }

  const idsNaSituacao = (situacao: Lote['situacao']) =>
    LOTES_MOCK.filter((item) => item.situacao === situacao).map((item) => item.id);

  describe('pesquisar', () => {
    it('CL-06: devolve a página pedida com o total de lotes encontrados', async () => {
      const pagina = await firstValueFrom(api.pesquisar(criarFiltros(), 1, 10));

      expect(pagina.itens.map((item) => item.id)).toEqual(
        LOTES_MOCK.slice(0, 10).map((item) => item.id),
      );
      expect(pagina.total).toBe(LOTES_MOCK.length);
    });

    it('CL-06: aplica os filtros antes de paginar', async () => {
      const enviados = idsNaSituacao('ENVIADO');

      const pagina = await firstValueFrom(
        api.pesquisar(criarFiltros({ situacao: 'ENVIADO' }), 1, 10),
      );

      expect(pagina.itens.every((item) => item.situacao === 'ENVIADO')).toBe(true);
      expect(pagina.total).toBe(enviados.length);
    });
  });

  describe('enviar', () => {
    it('CL-19, CL-22: muda os lotes de Aberto para Enviado e registra a data/hora', async () => {
      const [primeiro, segundo] = idsNaSituacao('ABERTO');

      await firstValueFrom(api.enviar([primeiro, segundo]));

      expect(await lote(primeiro)).toMatchObject({
        situacao: 'ENVIADO',
        dataHoraSituacao: '2026-06-01T14:30:00',
      });
      expect((await lote(segundo))?.situacao).toBe('ENVIADO');
    });

    it('CL-19: recusa a operação inteira se algum lote não estiver Aberto', async () => {
      const [aberto] = idsNaSituacao('ABERTO');
      const [confirmado] = idsNaSituacao('CONFIRMADO');

      await expect(firstValueFrom(api.enviar([aberto, confirmado]))).rejects.toThrow();

      expect((await lote(aberto))?.situacao).toBe('ABERTO');
    });
  });

  describe('confirmar', () => {
    it('CL-20, CL-22: muda de Enviado para Confirmado e registra o aprovador', async () => {
      const [enviado] = idsNaSituacao('ENVIADO');

      await firstValueFrom(api.confirmar([enviado]));

      expect(await lote(enviado)).toMatchObject({
        situacao: 'CONFIRMADO',
        usuarioAprovacao: USUARIO_LOGADO,
        dataHoraSituacao: '2026-06-01T14:30:00',
      });
    });

    it('CL-20: recusa lote que não está Enviado', async () => {
      const [aberto] = idsNaSituacao('ABERTO');

      await expect(firstValueFrom(api.confirmar([aberto]))).rejects.toThrow();
    });
  });

  describe('excluir', () => {
    it('CL-17: remove o lote Aberto', async () => {
      const [aberto] = idsNaSituacao('ABERTO');

      await firstValueFrom(api.excluir(aberto));

      expect(await lote(aberto)).toBeUndefined();
    });

    it('CL-17: recusa lote que não está Aberto', async () => {
      const [enviado] = idsNaSituacao('ENVIADO');

      await expect(firstValueFrom(api.excluir(enviado))).rejects.toThrow();
      expect(await lote(enviado)).toBeDefined();
    });
  });
});
