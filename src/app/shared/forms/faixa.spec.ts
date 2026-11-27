import { FormControl, FormGroup } from '@angular/forms';
import { ERRO_FAIXA, ErroNaFaixa, validarFaixa } from './faixa';

function faixa<T>(de: T | null, ate: T | null) {
  return new FormGroup(
    { de: new FormControl<T | null>(de), ate: new FormControl<T | null>(ate) },
    { validators: validarFaixa },
  );
}

describe('validarFaixa', () => {
  it('CL-05: aceita "De" menor ou igual a "Até"', () => {
    expect(faixa(1, 2).valid).toBe(true);
    expect(faixa(2, 2).valid).toBe(true);
  });

  it('CL-05: rejeita "De" maior que "Até"', () => {
    expect(faixa(3, 2).hasError(ERRO_FAIXA)).toBe(true);
  });

  it('CL-05: não restringe quando um dos limites está vazio', () => {
    expect(faixa(5, null).valid).toBe(true);
    expect(faixa(null, 5).valid).toBe(true);
    expect(faixa('', '3').valid).toBe(true);
  });

  it('CL-05: compara números digitados como texto pelo valor, não pela ordem alfabética', () => {
    expect(faixa('9', '10').valid).toBe(true);
    expect(faixa('10', '9').hasError(ERRO_FAIXA)).toBe(true);
  });

  it('CL-05: compara datas', () => {
    expect(faixa(new Date(2026, 4, 1), new Date(2026, 4, 31)).valid).toBe(true);
    expect(faixa(new Date(2026, 4, 31), new Date(2026, 4, 1)).hasError(ERRO_FAIXA)).toBe(true);
  });

  it('ignora textos não numéricos, que ficam a cargo do validador do próprio campo', () => {
    expect(faixa('abc', '1').valid).toBe(true);
  });
});

describe('ErroNaFaixa', () => {
  const matcher = new ErroNaFaixa();

  it('CL-05: marca o campo "Até" com erro quando a faixa é inválida e o campo foi tocado', () => {
    const grupo = faixa(3, 2);
    grupo.controls.ate.markAsTouched();

    expect(matcher.isErrorState(grupo.controls.ate, null)).toBe(true);
  });

  it('não mostra erro antes de o usuário tocar no campo', () => {
    const grupo = faixa(3, 2);

    expect(matcher.isErrorState(grupo.controls.ate, null)).toBe(false);
  });

  it('não marca erro com faixa válida', () => {
    const grupo = faixa(1, 2);
    grupo.controls.ate.markAsTouched();

    expect(matcher.isErrorState(grupo.controls.ate, null)).toBe(false);
  });
});
