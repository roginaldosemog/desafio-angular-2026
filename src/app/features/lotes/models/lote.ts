import { DataHoraIso, DataIso } from '../../../shared/models/datas';

/** Ciclo do lote: Aberto → Enviado → Confirmado. A lista também alimenta o filtro de situação. */
export const SITUACOES_LOTE = ['ABERTO', 'ENVIADO', 'CONFIRMADO'] as const;

export type SituacaoLote = (typeof SITUACOES_LOTE)[number];

/** O `Record` obriga a ter um rótulo para cada situação. */
export const ROTULO_SITUACAO_LOTE: Record<SituacaoLote, string> = {
  ABERTO: 'Aberto',
  ENVIADO: 'Enviado',
  CONFIRMADO: 'Confirmado',
};

export interface Lote {
  readonly id: number;
  /** Código da instituição responsável, ex.: `'0001'`. */
  readonly instituicaoResponsavel: string;
  /** Código da instituição, ex.: `'0002'`. */
  readonly instituicao: string;
  readonly dataEntrada: DataIso;
  /** Soma dos lançamentos, em centavos. */
  readonly valorCentavos: number;
  readonly quantidadeLancamentos: number;
  readonly usuarioRegistro: string;
  readonly usuarioAprovacao: string | null;
  readonly situacao: SituacaoLote;
  readonly dataHoraSituacao: DataHoraIso;
  readonly justificativa: string | null;
}
