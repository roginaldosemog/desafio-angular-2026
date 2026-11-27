import { Observable } from 'rxjs';
import { DadosLancamento, Lancamento } from '../models/lancamento';

/** Contrato de acesso aos lançamentos de um lote (padrão repositório, como `LotesApi`). */
export abstract class LancamentosApi {
  abstract listar(loteId: number): Observable<readonly Lancamento[]>;

  /**
   * Inclui um lançamento (IL-13). Sem `loteId`, cria antes um lote novo, Aberto (CL-15): assim
   * um modal aberto e fechado sem incluir nada não deixa lote vazio para trás.
   */
  abstract incluir(loteId: number | null, dados: DadosLancamento): Observable<Lancamento>;
}
