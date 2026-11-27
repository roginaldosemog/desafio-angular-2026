import { Lote, SituacaoLote } from '../models/lote';

export type AcaoLote =
  'confirmar' | 'enviar' | 'justificativa' | 'incluir' | 'alterar' | 'excluir' | 'visualizar';

/**
 * Quais ações a seleção atual permite (CL-14 a CL-21). Função pura: a regra de negócio fica
 * fora do componente, testada sem tela. Segue o ciclo Aberto → Enviado → Confirmado.
 */
export function acoesHabilitadas(selecionados: readonly Lote[]): Record<AcaoLote, boolean> {
  const quantidade = selecionados.length;
  const todos = (situacao: SituacaoLote) =>
    quantidade > 0 && selecionados.every((lote) => lote.situacao === situacao);
  const umSo = quantidade === 1 ? selecionados[0] : null;

  return {
    confirmar: todos('ENVIADO'),
    enviar: todos('ABERTO'),
    justificativa: umSo?.justificativa != null,
    incluir: true,
    alterar: umSo?.situacao === 'ABERTO',
    excluir: umSo?.situacao === 'ABERTO',
    visualizar: umSo !== null,
  };
}
