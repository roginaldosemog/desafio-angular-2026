import { Directive, ElementRef, inject, LOCALE_ID } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** 11 dígitos em centavos: até 999.999.999,99. */
const MAXIMO_DIGITOS = 11;

/**
 * Campo monetário preenchido da direita para a esquerda (DS-09): cada dígito entra pelos
 * centavos (1 → 0,01; 12 → 0,12; 123 → 1,23). O formulário recebe um inteiro em centavos.
 *
 * Trata o evento `input` (texto depois da edição) em vez das teclas: digitar, apagar, colar,
 * apagar uma seleção e o teclado do celular passam pelo mesmo caminho.
 */
@Directive({
  selector: 'input[appCampoMonetario]',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: CampoMonetario, multi: true }],
  host: {
    inputmode: 'numeric',
    autocomplete: 'off',
    style: 'text-align: right',
    '(input)': 'aoEditar()',
    '(blur)': 'notificarToque()',
  },
})
export class CampoMonetario implements ControlValueAccessor {
  private readonly campo = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly formato = new Intl.NumberFormat(inject(LOCALE_ID), {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private centavos: number | null = null;
  private notificarMudanca: (centavos: number | null) => void = () => undefined;
  protected notificarToque: () => void = () => undefined;

  writeValue(centavos: number | null): void {
    this.centavos = centavos;
    this.exibir();
  }

  registerOnChange(funcao: (centavos: number | null) => void): void {
    this.notificarMudanca = funcao;
  }

  registerOnTouched(funcao: () => void): void {
    this.notificarToque = funcao;
  }

  setDisabledState(desabilitado: boolean): void {
    this.campo.disabled = desabilitado;
  }

  protected aoEditar(): void {
    const digitos = this.campo.value.replace(/\D/g, '').replace(/^0+/, '');

    if (digitos.length <= MAXIMO_DIGITOS) {
      const centavos = digitos === '' ? null : Number(digitos);
      if (centavos !== this.centavos) {
        this.centavos = centavos;
        this.notificarMudanca(centavos);
      }
    }
    // Reescreve sempre: descarta o caractere inválido ou o dígito além do limite.
    this.exibir();
  }

  private exibir(): void {
    this.campo.value = this.centavos === null ? '' : this.formato.format(this.centavos / 100);
  }
}
