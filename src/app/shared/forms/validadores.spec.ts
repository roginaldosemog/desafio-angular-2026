import { FormControl } from '@angular/forms';
import { valorPositivo } from './validadores';

describe('valorPositivo', () => {
  const validar = (valor: number | null) => valorPositivo(new FormControl(valor));

  it('IL-04: aceita valor maior que zero', () => {
    expect(validar(1)).toBeNull();
    expect(validar(150000)).toBeNull();
  });

  it('IL-04: rejeita zero e valores negativos', () => {
    expect(validar(0)).toEqual({ valorPositivo: true });
    expect(validar(-100)).toEqual({ valorPositivo: true });
  });

  it('não acusa campo vazio: isso é papel do Validators.required', () => {
    expect(validar(null)).toBeNull();
  });
});
