import { Observable } from 'rxjs';
import { Pagina } from '../../../shared/models/pagina';
import {
  CampoBuscaEvento,
  ContaCorrente,
  Evento,
  Historico,
  Instituicao,
  PontoAtendimento,
} from '../models/cadastros';

/** Dados de apoio dos formulários (padrão repositório, como `LotesApi`). */
export abstract class CadastrosApi {
  abstract listarInstituicoes(): Observable<readonly Instituicao[]>;

  /** IL-03: a conta pelo número, ou `null` se não existir. */
  abstract buscarContaCorrente(numero: string): Observable<ContaCorrente | null>;

  abstract listarHistoricos(): Observable<readonly Historico[]>;

  abstract listarPontosAtendimento(): Observable<readonly PontoAtendimento[]>;

  /** IL-08: o evento pelo ID, ou `null` se não existir. */
  abstract buscarEvento(id: number): Observable<Evento | null>;

  /** IL-08: Pesquisa Evento. ID e código pelo valor exato; descrição por trecho. */
  abstract pesquisarEventos(
    campo: CampoBuscaEvento,
    valor: string,
    pagina: number,
    tamanhoPagina: number,
  ): Observable<Pagina<Evento>>;
}
