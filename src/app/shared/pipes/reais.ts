import { formatCurrency } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

/**
 * Exibe um valor em centavos como reais no formato do idioma (pt-BR: "R$ 1.000,00").
 * O modelo guarda centavos inteiros; a conversão para reais acontece só na tela.
 */
@Pipe({ name: 'reais' })
export class ReaisPipe implements PipeTransform {
  private readonly idioma = inject(LOCALE_ID);

  transform(centavos: number | null): string {
    return centavos === null ? '' : formatCurrency(centavos / 100, this.idioma, 'R$', 'BRL');
  }
}
