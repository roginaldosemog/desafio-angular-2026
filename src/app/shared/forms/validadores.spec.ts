import { FormControl } from '@angular/forms';
import { naoEmBranco, valorPositivo } from './validadores';

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

describe('naoEmBranco', () => {
  const validar = (texto: string) => naoEmBranco(new FormControl(texto));

  it('IL-18: texto só com espaços conta como obrigatório não preenchido', () => {
    expect(validar('   ')).toEqual({ required: true });
    expect(validar('\t\n')).toEqual({ required: true });
  });

  it('IL-18: aceita texto com conteúdo, mesmo com espaços em volta', () => {
    expect(validar('DOC-9')).toBeNull();
    expect(validar('  DOC-9  ')).toBeNull();
  });

  it('não acusa campo vazio: isso é papel do Validators.required', () => {
    expect(validar('')).toBeNull();
  });
});
