/** Uma página de resultados, como devolvida por uma API paginada. */
export interface Pagina<T> {
  readonly itens: readonly T[];
  /** Total de registros em todas as páginas. */
  readonly total: number;
  /** Número da página, começando em 1. */
  readonly pagina: number;
  readonly tamanhoPagina: number;
}
