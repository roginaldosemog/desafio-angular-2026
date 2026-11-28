import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { catchError, map, Observable, of, tap } from 'rxjs';

/** Erro de quando o servidor não respondeu: não dá para dizer se o registro existe (IL-17). */
export const ERRO_VERIFICACAO = 'verificacaoIndisponivel';

/**
 * Validador assíncrono genérico (IL-03, IL-08): o código digitado precisa existir no cadastro.
 * Usado pela conta corrente e pelo ID do evento.
 *
 * Recebe a função de busca (o serviço) em vez de injetá-lo, então é testável sem TestBed.
 * `aoBuscar` informa o registro encontrado (ou `null`) para a tela mostrar o titular ou a
 * descrição sem uma segunda consulta. `erro` é a chave do erro quando o registro não existe.
 */
export function existeNoCadastro<T>(
  buscar: (codigo: string) => Observable<T | null>,
  aoBuscar: (registro: T | null) => void,
  erro: string,
): AsyncValidatorFn {
  return (controle: AbstractControl<string>): Observable<ValidationErrors | null> => {
    const codigo = controle.value?.trim() ?? '';
    if (codigo === '') {
      aoBuscar(null);
      return of(null);
    }
    return buscar(codigo).pipe(
      tap(aoBuscar),
      map((registro): ValidationErrors | null => (registro ? null : { [erro]: true })),
      // IL-17: sem isto, uma falha do servidor deixaria o campo PENDING para sempre, e o
      // formulário nunca ficaria válido nem inválido. Vira um erro do campo, com nova tentativa.
      catchError(() => {
        aoBuscar(null);
        return of({ [ERRO_VERIFICACAO]: true });
      }),
    );
  };
}
