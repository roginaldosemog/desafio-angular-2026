import { Pagina } from '../../../../shared/models/pagina';

/** Recorta a página pedida (começando em 1), como faria um servidor paginado. */
export function paginar<T>(itens: readonly T[], pagina: number, tamanhoPagina: number): Pagina<T> {
  const inicio = (pagina - 1) * tamanhoPagina;

  return {
    itens: itens.slice(inicio, inicio + tamanhoPagina),
    total: itens.length,
    pagina,
    tamanhoPagina,
  };
}
