import { FiltrosLote } from '../models/filtros-lote';
import { Lote } from '../models/lote';

/** Lote válido para testes; cada teste informa só o que importa para ele. */
export function criarLote(variacoes: Partial<Lote> = {}): Lote {
  return {
    id: 1,
    instituicaoResponsavel: '0001',
    instituicao: '0002',
    dataEntrada: '2026-04-26',
    valorCentavos: 100000,
    quantidadeLancamentos: 1,
    usuarioRegistro: 'gearqc0300_00',
    usuarioAprovacao: null,
    situacao: 'ABERTO',
    dataHoraSituacao: '2026-04-27T12:35:11',
    justificativa: null,
    ...variacoes,
  };
}

/** Filtros padrão da tela, sem nenhuma restrição além das instituições. */
export function criarFiltros(variacoes: Partial<FiltrosLote> = {}): FiltrosLote {
  return {
    instituicaoResponsavel: '0001',
    instituicao: '0002',
    situacao: null,
    idLote: { de: null, ate: null },
    valorCentavos: { de: null, ate: null },
    dataEntrada: { de: null, ate: null },
    ...variacoes,
  };
}
