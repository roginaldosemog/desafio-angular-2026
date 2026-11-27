import { Directive, ElementRef, inject } from '@angular/core';

/** Data completa já com barras, como numa colagem ("8/8/1997"): fica como está. */
const DATA_COMPLETA = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

/**
 * Monta dd/mm/aaaa a partir dos dígitos (08081997 → 08/08/1997). As barras só entram quando
 * há dígito depois delas, então o backspace funciona sem ficar preso numa barra.
 */
export function mascararData(texto: string): string {
  if (DATA_COMPLETA.test(texto)) {
    return texto;
  }
  const digitos = texto.replace(/\D/g, '').slice(0, 8);
  const [dia, mes, ano] = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4)];
  return [dia, mes, ano].filter((parte) => parte !== '').join('/');
}

/**
 * Máscara de data (DS-10) para usar junto com o `matDatepicker`. Só formata o texto; quem
 * converte em data é o adaptador de datas.
 */
@Directive({
  selector: 'input[appMascaraData]',
  host: {
    inputmode: 'numeric',
    maxlength: '10',
    '(input)': 'aoEditar()',
  },
})
export class MascaraData {
  private readonly campo = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  protected aoEditar(): void {
    const mascarado = mascararData(this.campo.value);
    if (mascarado !== this.campo.value) {
      this.campo.value = mascarado;
      // Repete o evento com o texto já formatado: o datepicker lê de novo, qualquer que seja a
      // ordem em que os dois tratam o `input`. Na repetição, nada muda e o ciclo para.
      this.campo.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
