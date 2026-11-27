import { RotuloSituacaoPipe } from './rotulo-situacao';

describe('RotuloSituacaoPipe', () => {
  const pipe = new RotuloSituacaoPipe();

  it('CL-10: traduz o código da situação para o texto da tela', () => {
    expect(pipe.transform('ABERTO')).toBe('Aberto');
    expect(pipe.transform('ENVIADO')).toBe('Enviado');
    expect(pipe.transform('CONFIRMADO')).toBe('Confirmado');
  });
});
