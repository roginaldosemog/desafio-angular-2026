import { paginar } from './paginar';

describe('paginar', () => {
  const itens = Array.from({ length: 23 }, (_, indice) => indice + 1);

  it('CL-13: devolve os itens da página pedida e o total geral', () => {
    expect(paginar(itens, 2, 10)).toEqual({
      itens: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      total: 23,
      pagina: 2,
      tamanhoPagina: 10,
    });
  });

  it('CL-13: a última página pode ter menos itens', () => {
    expect(paginar(itens, 3, 10).itens).toEqual([21, 22, 23]);
  });

  it('CL-11: sem itens, devolve uma página vazia', () => {
    expect(paginar([], 1, 10)).toEqual({ itens: [], total: 0, pagina: 1, tamanhoPagina: 10 });
  });

  it('devolve página vazia quando o número passa da última', () => {
    expect(paginar(itens, 4, 10).itens).toEqual([]);
  });
});
