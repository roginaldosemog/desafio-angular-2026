import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Paginacao } from './paginacao';

describe('Paginacao', () => {
  let fixture: ComponentFixture<Paginacao>;
  let emitidas: number[];

  async function criar(pagina: number, total: number, tamanhoPagina = 10) {
    TestBed.configureTestingModule({ imports: [Paginacao] });
    fixture = TestBed.createComponent(Paginacao);
    fixture.componentRef.setInput('pagina', pagina);
    fixture.componentRef.setInput('total', total);
    fixture.componentRef.setInput('tamanhoPagina', tamanhoPagina);
    emitidas = [];
    fixture.componentInstance.trocarPagina.subscribe((numero) => emitidas.push(numero));
    await fixture.whenStable();
  }

  const botoes = (): HTMLButtonElement[] => [...fixture.nativeElement.querySelectorAll('button')];
  const botao = (nome: string) => {
    const encontrado = botoes().find((item) => item.getAttribute('aria-label') === nome);
    if (!encontrado) {
      throw new Error(`Botão "${nome}" não encontrado.`);
    }
    return encontrado;
  };

  it('CL-13: mostra primeira, anterior, os números, próxima e última, nessa ordem', async () => {
    await criar(1, 25);

    expect(botoes().map((item) => item.getAttribute('aria-label'))).toEqual([
      'Primeira página',
      'Página anterior',
      'Página 1',
      'Página 2',
      'Página 3',
      'Próxima página',
      'Última página',
    ]);
    expect(
      botoes()
        .map((item) => item.textContent?.trim())
        .slice(2, 5),
    ).toEqual(['1', '2', '3']);
  });

  it('CL-13: destaca a página atual', async () => {
    await criar(2, 25);

    expect(botao('Página 2').getAttribute('aria-current')).toBe('page');
    expect(botao('Página 1').hasAttribute('aria-current')).toBe(false);
  });

  it('CL-13: na primeira página, desabilita primeira e anterior', async () => {
    await criar(1, 25);

    expect(botao('Primeira página').disabled).toBe(true);
    expect(botao('Página anterior').disabled).toBe(true);
    expect(botao('Próxima página').disabled).toBe(false);
    expect(botao('Última página').disabled).toBe(false);
  });

  it('CL-13: na última página, desabilita próxima e última', async () => {
    await criar(3, 25);

    expect(botao('Próxima página').disabled).toBe(true);
    expect(botao('Última página').disabled).toBe(true);
    expect(botao('Primeira página').disabled).toBe(false);
  });

  it('CL-13: cada botão pede a página certa', async () => {
    await criar(2, 25);

    botao('Primeira página').click();
    botao('Página anterior').click();
    botao('Página 3').click();
    botao('Próxima página').click();
    botao('Última página').click();

    expect(emitidas).toEqual([1, 1, 3, 3, 3]);
  });

  it('clicar na página atual não pede nada', async () => {
    await criar(2, 25);

    botao('Página 2').click();

    expect(emitidas).toEqual([]);
  });

  it('com muitas páginas, mostra até 5 números em torno da atual', async () => {
    await criar(10, 200);

    const numeros = botoes()
      .map((item) => item.textContent?.trim())
      .filter((texto) => /^\d+$/.test(texto ?? ''));

    expect(numeros).toEqual(['8', '9', '10', '11', '12']);
  });

  it('perto do fim, a janela de números não passa da última página', async () => {
    await criar(20, 200);

    const numeros = botoes()
      .map((item) => item.textContent?.trim())
      .filter((texto) => /^\d+$/.test(texto ?? ''));

    expect(numeros).toEqual(['16', '17', '18', '19', '20']);
  });

  it('CL-11: sem resultados, não mostra a paginação', async () => {
    await criar(1, 0);

    expect(botoes()).toEqual([]);
  });

  it('DS-19: fica num elemento de navegação com nome acessível', async () => {
    await criar(1, 25);

    expect(fixture.nativeElement.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Paginação',
    );
  });
});
