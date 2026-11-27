import { AbstractControl, FormGroupDirective, NgForm, ValidationErrors } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export const ERRO_FAIXA = 'faixaInvalida';

/**
 * Validador de grupo De/Até (CL-05): "De" não pode ser maior que "Até". Um limite vazio não
 * restringe. Serve para números, números digitados como texto e datas.
 */
export function validarFaixa(grupo: AbstractControl): ValidationErrors | null {
  const de = comparavel(grupo.get('de')?.value);
  const ate = comparavel(grupo.get('ate')?.value);

  return de !== null && ate !== null && de > ate ? { [ERRO_FAIXA]: true } : null;
}

function comparavel(valor: unknown): number | null {
  if (valor instanceof Date) {
    return valor.getTime();
  }
  if (typeof valor === 'number') {
    return valor;
  }
  if (typeof valor === 'string' && valor.trim() !== '') {
    const numero = Number(valor);
    return Number.isNaN(numero) ? null : numero;
  }
  return null;
}

/**
 * O erro de faixa pertence ao grupo, mas o Material só pinta de vermelho o campo inválido.
 * Este matcher marca o campo "Até" também quando o grupo tem erro de faixa.
 */
export class ErroNaFaixa implements ErrorStateMatcher {
  isErrorState(
    controle: AbstractControl | null,
    form: FormGroupDirective | NgForm | null,
  ): boolean {
    if (!controle) {
      return false;
    }
    const interagiu = controle.touched || (form?.submitted ?? false);
    return interagiu && (controle.invalid || (controle.parent?.hasError(ERRO_FAIXA) ?? false));
  }
}
