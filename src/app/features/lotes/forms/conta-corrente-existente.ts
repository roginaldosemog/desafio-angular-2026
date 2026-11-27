import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { map, Observable, of, tap } from 'rxjs';
import { ContaCorrente } from '../models/cadastros';

/**
 * Validador assíncrono (IL-03): a conta precisa existir no cadastro. Recebe a função de busca
 * (o serviço) em vez de injetá-lo, então é testável sem TestBed. `aoBuscar` informa a conta
 * encontrada (ou `null`) para a tela mostrar o titular sem uma segunda consulta.
 */
export function contaCorrenteExistente(
  buscar: (numero: string) => Observable<ContaCorrente | null>,
  aoBuscar: (conta: ContaCorrente | null) => void,
): AsyncValidatorFn {
  return (controle: AbstractControl<string>): Observable<ValidationErrors | null> => {
    const numero = controle.value?.trim() ?? '';
    if (numero === '') {
      aoBuscar(null);
      return of(null);
    }
    return buscar(numero).pipe(
      tap(aoBuscar),
      map((conta) => (conta ? null : { contaNaoEncontrada: true })),
    );
  };
}
