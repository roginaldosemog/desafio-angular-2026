/** Intervalo De/Até de um filtro. `null` indica limite não informado. */
export interface Faixa<T> {
  readonly de: T | null;
  readonly ate: T | null;
}
