import { Faixa } from '../../../../shared/models/faixa';
import { FiltrosLote } from '../../models/filtros-lote';
import { Lote } from '../../models/lote';

/** Filtragem que um servidor real faria; limites das faixas são inclusivos. */
export function filtrarLotes(lotes: readonly Lote[], filtros: FiltrosLote): Lote[] {
  return lotes.filter(
    (lote) =>
      lote.instituicaoResponsavel === filtros.instituicaoResponsavel &&
      lote.instituicao === filtros.instituicao &&
      (filtros.situacao === null || lote.situacao === filtros.situacao) &&
      dentroDaFaixa(lote.id, filtros.idLote) &&
      dentroDaFaixa(lote.valorCentavos, filtros.valorCentavos) &&
      dentroDaFaixa(lote.dataEntrada, filtros.dataEntrada),
  );
}

/** Funciona para números e para datas `AAAA-MM-DD`, cuja ordem alfabética é a cronológica. */
function dentroDaFaixa<T extends number | string>(valor: T, faixa: Faixa<T>): boolean {
  return (faixa.de === null || valor >= faixa.de) && (faixa.ate === null || valor <= faixa.ate);
}
