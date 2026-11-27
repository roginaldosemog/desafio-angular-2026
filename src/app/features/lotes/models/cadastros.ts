import { DataIso } from '../../../shared/models/datas';

/** Dados de apoio usados em listas e buscas dos formulários. */

export interface Instituicao {
  /** Ex.: `'0001'`. */
  readonly codigo: string;
  /** Ex.: `'SICOOB'`. */
  readonly nome: string;
}

export interface ContaCorrente {
  readonly numero: string;
  readonly titular: string;
}

export interface Historico {
  readonly id: number;
  readonly descricao: string;
}

/** Ponto de Atendimento (PA) da cooperativa. */
export interface PontoAtendimento {
  readonly id: number;
  readonly nome: string;
}

/** Por qual campo a Pesquisa Evento procura (IL-08). */
export type CampoBuscaEvento = 'id' | 'codigo' | 'descricao';

export interface Evento {
  readonly id: number;
  readonly codigo: number;
  readonly descricao: string;
  readonly dataInicio: DataIso;
  readonly dataFim: DataIso | null;
}
