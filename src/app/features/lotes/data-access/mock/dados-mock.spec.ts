import { SITUACOES_LOTE } from '../../models/lote';
import {
  CONTAS_CORRENTES,
  EVENTOS,
  HISTORICOS,
  INSTITUICOES,
  PONTOS_ATENDIMENTO,
} from './cadastros.mock';
import { LANCAMENTOS_MOCK, LOTES_MOCK } from './lotes.mock';

const TAMANHO_PAGINA = 10;

function lancamentosDoLote(loteId: number) {
  return LANCAMENTOS_MOCK.filter((lancamento) => lancamento.loteId === loteId);
}

function idsRepetidos(ids: readonly number[]): number[] {
  return ids.filter((id, indice) => ids.indexOf(id) !== indice);
}

describe('Dados mock', () => {
  describe('lotes', () => {
    it('CL-13: tem lotes suficientes para mais de uma página', () => {
      expect(LOTES_MOCK.length).toBeGreaterThan(TAMANHO_PAGINA);
    });

    it('têm IDs únicos', () => {
      expect(idsRepetidos(LOTES_MOCK.map((lote) => lote.id))).toEqual([]);
    });

    it('cobrem todas as situações', () => {
      const situacoes = new Set(LOTES_MOCK.map((lote) => lote.situacao));

      expect([...situacoes].sort()).toEqual([...SITUACOES_LOTE].sort());
    });

    it('CL-21: incluem ao menos dois lotes com justificativa', () => {
      const comJustificativa = LOTES_MOCK.filter((lote) => lote.justificativa !== null);

      expect(comJustificativa.length).toBeGreaterThanOrEqual(2);
    });

    it('têm valor e quantidade iguais à soma dos seus lançamentos', () => {
      for (const lote of LOTES_MOCK) {
        const lancamentos = lancamentosDoLote(lote.id);
        const soma = lancamentos.reduce((total, item) => total + item.valorCentavos, 0);

        expect({
          id: lote.id,
          quantidade: lote.quantidadeLancamentos,
          valor: lote.valorCentavos,
        }).toEqual({ id: lote.id, quantidade: lancamentos.length, valor: soma });
      }
    });

    it('registram o usuário de aprovação somente nos lotes confirmados', () => {
      for (const lote of LOTES_MOCK) {
        expect({ id: lote.id, aprovado: lote.usuarioAprovacao !== null }).toEqual({
          id: lote.id,
          aprovado: lote.situacao === 'CONFIRMADO',
        });
      }
    });

    it('usam instituições cadastradas', () => {
      const codigos = INSTITUICOES.map((instituicao) => instituicao.codigo);

      for (const lote of LOTES_MOCK) {
        expect(codigos).toContain(lote.instituicaoResponsavel);
        expect(codigos).toContain(lote.instituicao);
      }
    });

    it('têm a situação registrada depois da data de entrada', () => {
      for (const lote of LOTES_MOCK) {
        expect(lote.dataHoraSituacao.slice(0, 10) >= lote.dataEntrada).toBe(true);
      }
    });
  });

  describe('lançamentos', () => {
    it('têm IDs únicos', () => {
      expect(idsRepetidos(LANCAMENTOS_MOCK.map((lancamento) => lancamento.id))).toEqual([]);
    });

    it('pertencem a lotes existentes', () => {
      const idsLotes = LOTES_MOCK.map((lote) => lote.id);

      for (const lancamento of LANCAMENTOS_MOCK) {
        expect(idsLotes).toContain(lancamento.loteId);
      }
    });

    it('IL-03: usam contas cadastradas, com o titular da conta', () => {
      for (const lancamento of LANCAMENTOS_MOCK) {
        const conta = CONTAS_CORRENTES.find((item) => item.numero === lancamento.contaCorrente);

        expect(conta?.titular).toBe(lancamento.titular);
      }
    });

    it('IL-04: têm valor maior que zero', () => {
      for (const lancamento of LANCAMENTOS_MOCK) {
        expect(lancamento.valorCentavos).toBeGreaterThan(0);
      }
    });

    it('usam históricos, PAs e eventos cadastrados', () => {
      const historicos = HISTORICOS.map((historico) => historico.id);
      const pas = PONTOS_ATENDIMENTO.map((pa) => pa.id);
      const eventos = EVENTOS.map((evento) => evento.id);

      for (const { historicoId, documentoCsc } of LANCAMENTOS_MOCK) {
        expect(historicos).toContain(historicoId);
        expect(pas).toContain(documentoCsc.paId);
        if (documentoCsc.eventoId !== null) {
          expect(eventos).toContain(documentoCsc.eventoId);
        }
      }
    });

    it('IL-10: incluem ao menos um lançamento com anexo', () => {
      expect(LANCAMENTOS_MOCK.some((lancamento) => lancamento.anexos.length > 0)).toBe(true);
    });
  });

  describe('cadastros', () => {
    it('IL-08: incluem o evento 102 da referência', () => {
      expect(EVENTOS).toContainEqual(
        expect.objectContaining({
          id: 102,
          codigo: 300,
          descricao: 'Centralizacao Titulo CSC Credito',
          dataInicio: '2019-12-31',
        }),
      );
    });

    it('IL-05: incluem o histórico "Lançamento Manual"', () => {
      expect(HISTORICOS.map((historico) => historico.descricao)).toContain('Lançamento Manual');
    });
  });
});
