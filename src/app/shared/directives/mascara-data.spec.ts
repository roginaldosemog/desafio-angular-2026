import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideDatasPtBr } from '../datas/datas-pt-br';
import { MascaraData, mascararData } from './mascara-data';

describe('mascararData', () => {
  it('DS-10: insere as barras conforme os dígitos são digitados', () => {
    expect(mascararData('0')).toBe('0');
    expect(mascararData('08')).toBe('08');
    expect(mascararData('080')).toBe('08/0');
    expect(mascararData('0808')).toBe('08/08');
    expect(mascararData('08081')).toBe('08/08/1');
    expect(mascararData('08081997')).toBe('08/08/1997');
  });

  it('DS-10: não deixa barra pendurada no fim, para o backspace funcionar', () => {
    expect(mascararData('08/')).toBe('08');
    expect(mascararData('08/08/')).toBe('08/08');
  });

  it('DS-10: ignora o que não é dígito e o que passa de 8 dígitos', () => {
    expect(mascararData('0a8b0c8')).toBe('08/08');
    expect(mascararData('080819971')).toBe('08/08/1997');
  });

  it('DS-10: mantém uma data colada já completa, mesmo com dia e mês de um dígito', () => {
    expect(mascararData('8/8/1997')).toBe('8/8/1997');
  });
});

@Component({
  imports: [
    ReactiveFormsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MascaraData,
  ],
  template: `
    <mat-form-field>
      <input matInput appMascaraData [matDatepicker]="calendario" [formControl]="data" />
      <mat-datepicker #calendario />
    </mat-form-field>
  `,
})
class Hospedeiro {
  readonly data = new FormControl<Date | null>(null);
}

describe('MascaraData', () => {
  let campo: HTMLInputElement;
  let controle: FormControl<Date | null>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Hospedeiro],
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }, provideDatasPtBr()],
    });
    const fixture = TestBed.createComponent(Hospedeiro);
    fixture.detectChanges();
    campo = fixture.nativeElement.querySelector('input');
    controle = fixture.componentInstance.data;
  });

  function digitar(teclas: string): void {
    for (const tecla of teclas) {
      campo.value += tecla;
      campo.dispatchEvent(new Event('input'));
    }
  }

  it('DS-10: digitar 08081997 mostra 08/08/1997 e o datepicker recebe a data', () => {
    digitar('08081997');

    expect(campo.value).toBe('08/08/1997');
    expect(controle.value).toEqual(new Date(1997, 7, 8));
  });

  it('DS-10: colar 08081997 de uma vez também chega ao datepicker como data', () => {
    campo.value = '08081997';
    campo.dispatchEvent(new Event('input'));

    expect(campo.value).toBe('08/08/1997');
    expect(controle.value).toEqual(new Date(1997, 7, 8));
  });

  it('DS-10: pede o teclado numérico e limita a 10 caracteres', () => {
    expect(campo.getAttribute('inputmode')).toBe('numeric');
    expect(campo.getAttribute('maxlength')).toBe('10');
  });
});
