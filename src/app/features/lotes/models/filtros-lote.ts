import { DataIso } from '../../../shared/models/datas';
import { Faixa } from '../../../shared/models/faixa';
import { SituacaoLote } from './lote';

export interface FiltrosLote {
  readonly instituicaoResponsavel: string;
  readonly instituicao: string;
  /** `null` corresponde à opção "Todas". */
  readonly situacao: SituacaoLote | null;
  readonly idLote: Faixa<number>;
  readonly valorCentavos: Faixa<number>;
  readonly dataEntrada: Faixa<DataIso>;
}
