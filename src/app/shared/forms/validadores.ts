import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validador customizado (IL-04): valor maior que zero. Campo vazio passa, porque obrigatoriedade
 * é papel do `Validators.required`: cada validador cuida de uma regra só.
 */
export function valorPositivo(controle: AbstractControl<number | null>): ValidationErrors | null {
  const valor = controle.value;
  return valor !== null && valor <= 0 ? { valorPositivo: true } : null;
}
