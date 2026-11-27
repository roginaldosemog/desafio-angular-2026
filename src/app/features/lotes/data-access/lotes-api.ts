import { Observable } from 'rxjs';
import { Pagina } from '../../../shared/models/pagina';
import { FiltrosLote } from '../models/filtros-lote';
import { Lote } from '../models/lote';

/**
 * Contrato de acesso aos lotes (padrão repositório). Os componentes dependem só desta classe;
 * trocar a implementação simulada por uma com HttpClient não muda nenhum componente.
 * É uma classe abstrata, e não uma interface, porque também serve de token de injeção.
 */
export abstract class LotesApi {
  abstract pesquisar(
    filtros: FiltrosLote,
    pagina: number,
    tamanhoPagina: number,
  ): Observable<Pagina<Lote>>;
}
