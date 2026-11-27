import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CampoMonetario } from './campo-monetario';

@Component({
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, CampoMonetario],
  template: `
    <mat-form-field>
      <mat-label>Valor</mat-label>
      <input matInput appCampoMonetario [formControl]="valor" />
    </mat-form-field>
  `,
})
class Hospedeiro {
  readonly valor = new FormControl<number | null>(null);
}

describe('CampoMonetario', () => {
  let campo: HTMLInputElement;
  let controle: FormControl<number | null>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Hospedeiro],
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    const fixture = TestBed.createComponent(Hospedeiro);
    fixture.detectChanges();
    campo = fixture.nativeElement.querySelector('input');
    controle = fixture.componentInstance.valor;
  });

  /** Simula o navegador: altera o texto do campo e dispara o evento `input`. */
  function editar(texto: string): void {
    campo.value = texto;
    campo.dispatchEvent(new Event('input'));
  }

  function digitar(teclas: string): void {
    for (const tecla of teclas) {
      editar(campo.value + tecla);
    }
  }

  function apagarUltimo(): void {
    editar(campo.value.slice(0, -1));
  }

  it('DS-09: preenche da direita para a esquerda, a partir dos centavos', () => {
    digitar('1');
    expect(campo.value).toBe('R$ 0,01');

    digitar('2');
    expect(campo.value).toBe('R$ 0,12');

    digitar('3');
    expect(campo.value).toBe('R$ 1,23');
    expect(controle.value).toBe(123);
  });

  it('DS-09: formata milhares no padrão pt-BR', () => {
    digitar('123456789');

    expect(campo.value).toBe('R$ 1.234.567,89');
    expect(controle.value).toBe(123456789);
  });

  it('DS-09: backspace remove o último dígito', () => {
    digitar('123');

    apagarUltimo();

    expect(campo.value).toBe('R$ 0,12');
    expect(controle.value).toBe(12);
  });

  it('DS-09: apagar todos os dígitos deixa o campo vazio e o valor nulo', () => {
    digitar('12');

    apagarUltimo();
    apagarUltimo();
    apagarUltimo();

    expect(campo.value).toBe('');
    expect(controle.value).toBeNull();
  });

  it('DS-09: ignora o que não é dígito', () => {
    digitar('12');

    digitar('a');

    expect(campo.value).toBe('R$ 0,12');
    expect(controle.value).toBe(12);
  });

  it('DS-09: colar "1.234,56" resulta em 1.234,56', () => {
    editar('1.234,56');

    expect(campo.value).toBe('R$ 1.234,56');
    expect(controle.value).toBe(123456);
  });

  it('DS-09: colar um valor com "R$" também funciona', () => {
    editar('R$ 10,50');

    expect(campo.value).toBe('R$ 10,50');
    expect(controle.value).toBe(1050);
  });

  it('DS-09: não passa de 999.999.999,99', () => {
    digitar('99999999999');

    digitar('5');

    expect(campo.value).toBe('R$ 999.999.999,99');
    expect(controle.value).toBe(99999999999);
  });

  it('DS-09: exibe formatado o valor definido pelo formulário, em centavos', () => {
    controle.setValue(500000);
    expect(campo.value).toBe('R$ 5.000,00');

    controle.setValue(null);
    expect(campo.value).toBe('');
  });

  it('DS-09: alinha à direita e pede o teclado numérico no celular', () => {
    expect(campo.getAttribute('inputmode')).toBe('numeric');
    expect(campo.style.textAlign).toBe('right');
  });

  it('marca o controle como tocado ao sair do campo', () => {
    campo.dispatchEvent(new Event('blur'));

    expect(controle.touched).toBe(true);
  });

  it('desabilita o campo junto com o controle', () => {
    controle.disable();

    expect(campo.disabled).toBe(true);
  });
});
