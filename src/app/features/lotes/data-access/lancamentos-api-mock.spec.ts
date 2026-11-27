import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { DadosLancamento } from '../models/lancamento';
import { criarFiltros } from '../testing/fabricas';
import { LancamentosApi } from './lancamentos-api';
import { LancamentosApiMock } from './lancamentos-api-mock';
import { LotesApi } from './lotes-api';
import { LotesApiMock } from './lotes-api-mock';
import { BancoEmMemoria } from './mock/banco-em-memoria';
import { USUARIO_LOGADO } from './mock/cadastros.mock';
import { LANCAMENTOS_MOCK, LOTES_MOCK } from './mock/lotes.mock';
import { ATRASO_SIMULADO_MS, RELOGIO_SIMULADO, ServidorSimulado } from './mock/servidor-simulado';

const AGORA = new Date(2026, 5, 1, 14, 30, 0);

/** Dados válidos de um lançamento; cada teste muda só o que importa. */
function dados(variacoes: Partial<DadosLancamento> = {}): DadosLancamento {
  return {
    contaCorrente: '44444',
    valorCentavos: 2000,
    historicoId: 1,
    estorno: false,
    documento: 'DOC-1',
    descricao: '',
    documentoCsc: { paId: 1, eventoId: null, complementoHistorico: '', idDocumentoCsc: '' },
    anexos: [],
    ...variacoes,
  };
}

describe('LancamentosApiMock', () => {
  let lancamentos: LancamentosApi;
  let lotes: LotesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ServidorSimulado,
        BancoEmMemoria,
        { provide: ATRASO_SIMULADO_MS, useValue: 0 },
        { provide: RELOGIO_SIMULADO, useValue: () => AGORA },
        { provide: LotesApi, useClass: LotesApiMock },
        { provide: LancamentosApi, useClass: LancamentosApiMock },
      ],
    });
    lancamentos = TestBed.inject(LancamentosApi);
    lotes = TestBed.inject(LotesApi);
  });

  async function lote(id: number) {
    const pagina = await firstValueFrom(
      lotes.pesquisar(criarFiltros({ idLote: { de: id, ate: id } }), 1, 10),
    );
    return pagina.itens[0];
  }

  it('lista os lançamentos de um lote', async () => {
    const doLote = LANCAMENTOS_MOCK.filter((item) => item.loteId === 4);

    expect(await firstValueFrom(lancamentos.listar(4))).toEqual(doLote);
  });

  it('CL-15: incluir sem lote cria um lote novo, Aberto, com data de hoje', async () => {
    const incluido = await firstValueFrom(lancamentos.incluir(null, dados()));

    const novo = await lote(incluido.loteId);
    expect(novo).toMatchObject({
      id: Math.max(...LOTES_MOCK.map((item) => item.id)) + 1,
      situacao: 'ABERTO',
      dataEntrada: '2026-06-01',
      usuarioRegistro: USUARIO_LOGADO,
      valorCentavos: 2000,
      quantidadeLancamentos: 1,
    });
  });

  it('IL-13: incluir num lote existente soma valor e quantidade do lote', async () => {
    const antes = await lote(2);

    await firstValueFrom(lancamentos.incluir(2, dados({ valorCentavos: 500 })));

    expect(await lote(2)).toMatchObject({
      valorCentavos: antes.valorCentavos + 500,
      quantidadeLancamentos: antes.quantidadeLancamentos + 1,
    });
    expect(await firstValueFrom(lancamentos.listar(2))).toHaveLength(
      antes.quantidadeLancamentos + 1,
    );
  });

  it('IL-03, IL-06: o lançamento gravado tem o titular da conta e fica Pendente', async () => {
    const incluido = await firstValueFrom(lancamentos.incluir(null, dados()));

    expect(incluido).toMatchObject({
      titular: 'Ana Paula Costa',
      situacao: 'PENDENTE',
      situacaoDocumentoCsc: 'AGUARDANDO_PROCESSAMENTO_CCO',
    });
  });

  it('IL-03: recusa conta corrente inexistente', async () => {
    await expect(
      firstValueFrom(lancamentos.incluir(null, dados({ contaCorrente: '99999' }))),
    ).rejects.toThrow();
  });

  it('IL-04: recusa valor que não é maior que zero', async () => {
    await expect(
      firstValueFrom(lancamentos.incluir(null, dados({ valorCentavos: 0 }))),
    ).rejects.toThrow();
  });

  it('CL-16: recusa incluir em lote que não está Aberto', async () => {
    const enviado = LOTES_MOCK.find((item) => item.situacao === 'ENVIADO');

    await expect(firstValueFrom(lancamentos.incluir(enviado?.id ?? 0, dados()))).rejects.toThrow();
  });

  it('CL-17: excluir o lote remove também os lançamentos dele', async () => {
    await firstValueFrom(lotes.excluir(2));

    expect(await firstValueFrom(lancamentos.listar(2))).toEqual([]);
  });
});
