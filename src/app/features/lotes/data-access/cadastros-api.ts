import { Observable } from 'rxjs';
import { ContaCorrente, Historico, Instituicao, PontoAtendimento } from '../models/cadastros';

/** Dados de apoio dos formulários (padrão repositório, como `LotesApi`). */
export abstract class CadastrosApi {
  abstract listarInstituicoes(): Observable<readonly Instituicao[]>;

  /** IL-03: a conta pelo número, ou `null` se não existir. */
  abstract buscarContaCorrente(numero: string): Observable<ContaCorrente | null>;

  abstract listarHistoricos(): Observable<readonly Historico[]>;

  abstract listarPontosAtendimento(): Observable<readonly PontoAtendimento[]>;
}
