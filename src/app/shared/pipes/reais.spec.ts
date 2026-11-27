import '@angular/common/locales/global/pt';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ReaisPipe } from './reais';

describe('ReaisPipe', () => {
  let pipe: ReaisPipe;

  /** O pt-BR separa "R$" do número com espaço não separável; nos testes, comparo com espaço comum. */
  const formatar = (centavos: number | null) => pipe.transform(centavos).replace(/\s/g, ' ');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReaisPipe, { provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    pipe = TestBed.inject(ReaisPipe);
  });

  it('CL-10: exibe centavos como reais no formato pt-BR', () => {
    expect(formatar(100000)).toBe('R$ 1.000,00');
    expect(formatar(5)).toBe('R$ 0,05');
    expect(formatar(123456789)).toBe('R$ 1.234.567,89');
  });

  it('não exibe nada para valor ausente', () => {
    expect(formatar(null)).toBe('');
  });
});
