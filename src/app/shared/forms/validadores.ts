import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validador customizado (IL-04): valor maior que zero. Campo vazio passa, porque obrigatoriedade
 * é papel do `Validators.required`: cada validador cuida de uma regra só.
 */
/**
 * Validador customizado (IL-18): texto só com espaços conta como não preenchido. Complementa o
 * `Validators.required` (que continua no campo: é dele que o Material tira o `aria-required` e o
 * asterisco) e devolve a mesma chave `required`, então a mensagem de obrigatório é reaproveitada.
 * Campo vazio passa: já é acusado pelo `required`.
 */
export function naoEmBranco(controle: AbstractControl<string | null>): ValidationErrors | null {
  const texto = controle.value ?? '';
  return texto !== '' && texto.trim() === '' ? { required: true } : null;
}

export function valorPositivo(controle: AbstractControl<number | null>): ValidationErrors | null {
  const valor = controle.value;
  return valor !== null && valor <= 0 ? { valorPositivo: true } : null;
}
