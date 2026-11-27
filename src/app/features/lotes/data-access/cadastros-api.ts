import { Observable } from 'rxjs';
import { Instituicao } from '../models/cadastros';

/** Dados de apoio dos formulários (padrão repositório, como `LotesApi`). */
export abstract class CadastrosApi {
  abstract listarInstituicoes(): Observable<readonly Instituicao[]>;
}
