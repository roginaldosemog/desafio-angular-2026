import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDatepickerInputHarness } from '@angular/material/datepicker/testing';
import { MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideDatasPtBr } from '../../../../shared/datas/datas-pt-br';
import { FiltrosLote } from '../../models/filtros-lote';
import { ATRASO_PESQUISA_AUTOMATICA_MS, FILTROS_PADRAO, FiltrosLotes } from './filtros-lotes';

const INSTITUICOES = [
  { codigo: '0001', nome: 'SICOOB' },
  { codigo: '0002', nome: 'SICOOB CENTRAL' },
];

describe('FiltrosLotes', () => {
  let fixture: ComponentFixture<FiltrosLotes>;
  let loader: HarnessLoader;
  let emitidos: FiltrosLote[];

  /**
   * Nos testes do envio, a pesquisa automática fica fora do caminho (1 minuto de espera): uma
   * pausa entre duas ações do teste não pode disparar uma pesquisa e torná-lo instável. Os testes
   * do debounce, no fim do arquivo, usam o tempo real de 400 ms com relógio falso.
   */
  async function criar(atrasoPesquisaAutomaticaMs = 60_000) {
    TestBed.configureTestingModule({
      imports: [FiltrosLotes],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        provideDatasPtBr(),
        { provide: ATRASO_PESQUISA_AUTOMATICA_MS, useValue: atrasoPesquisaAutomaticaMs },
      ],
    });
    fixture = TestBed.createComponent(FiltrosLotes);
    fixture.componentRef.setInput('instituicoes', INSTITUICOES);
    emitidos = [];
    fixture.componentInstance.pesquisar.subscribe((filtros) => emitidos.push(filtros));
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  }

  beforeEach(() => criar());

  const campo = (classe: string) =>
    loader.getHarness(MatInputHarness.with({ selector: `.${classe}` }));
  const data = (classe: string) =>
    loader.getHarness(MatDatepickerInputHarness.with({ selector: `.${classe}` }));
  const errosDo = async (classe: string) =>
    (
      await loader.getHarness(MatFormFieldHarness.with({ selector: `.campo-${classe}` }))
    ).getTextErrors();
  const pesquisar = async () =>
    (await loader.getHarness(MatButtonHarness.with({ text: 'Pesquisar' }))).click();

  it('CL-03: o painel começa aberto e pode ser recolhido e expandido', async () => {
    const painel = await loader.getHarness(MatExpansionPanelHarness);
    expect(await painel.isExpanded()).toBe(true);

    await painel.toggle();
    expect(await painel.isExpanded()).toBe(false);

    await painel.toggle();
    expect(await painel.isExpanded()).toBe(true);
  });

  it('CL-04: mostra a instituição responsável como somente leitura', async () => {
    const instituicaoResponsavel = await campo('instituicao-responsavel');

    expect(await instituicaoResponsavel.getValue()).toBe('0001 - SICOOB');
    expect(await instituicaoResponsavel.isReadonly()).toBe(true);
  });

  it('CL-04: oferece as instituições, com "0002 - SICOOB CENTRAL" como padrão', async () => {
    const instituicao = await loader.getHarness(
      MatSelectHarness.with({ selector: '.instituicao' }),
    );

    expect(await instituicao.getValueText()).toBe('0002 - SICOOB CENTRAL');
  });

  it('CL-04: oferece as situações Todas, Aberto, Enviado e Confirmado, com Todas como padrão', async () => {
    const situacao = await loader.getHarness(MatSelectHarness.with({ selector: '.situacao' }));
    expect(await situacao.getValueText()).toBe('Todas');

    await situacao.open();
    const opcoes = await situacao.getOptions();

    expect(await Promise.all(opcoes.map((opcao) => opcao.getText()))).toEqual([
      'Todas',
      'Aberto',
      'Enviado',
      'Confirmado',
    ]);
  });

  it('CL-06: Pesquisar sem alterar nada envia os filtros padrão', async () => {
    await pesquisar();

    expect(emitidos).toEqual([FILTROS_PADRAO]);
  });

  it('CL-06: envia os filtros informados, convertidos para o modelo', async () => {
    const situacao = await loader.getHarness(MatSelectHarness.with({ selector: '.situacao' }));
    await situacao.open();
    await situacao.clickOptions({ text: 'Enviado' });
    await (await campo('id-lote-de')).setValue('2');
    await (await campo('id-lote-ate')).setValue('15');
    await (await campo('valor-lote-de')).setValue('1000');
    await (await data('data-entrada-de')).setValue('01/05/2026');
    await (await data('data-entrada-ate')).setValue('31/05/2026');

    await pesquisar();

    expect(emitidos).toEqual([
      {
        ...FILTROS_PADRAO,
        situacao: 'ENVIADO',
        idLote: { de: 2, ate: 15 },
        valorCentavos: { de: 1000, ate: null },
        dataEntrada: { de: '2026-05-01', ate: '2026-05-31' },
      },
    ]);
  });

  it('DS-09: o valor usa o campo monetário, com placeholder R$ 0,00', async () => {
    const valor = await campo('valor-lote-de');
    expect(await valor.getPlaceholder()).toBe('R$ 0,00');

    // Digita como o usuário; o setValue do harness grava o texto bruto no fim e esconderia a formatação.
    const elemento = await valor.host();
    await elemento.sendKeys('123');

    expect(await elemento.getProperty('value')).toBe('R$ 1,23');
  });

  it('DS-10: digitar só os números da data insere as barras', async () => {
    const elemento = await (await data('data-entrada-de')).host();

    await elemento.sendKeys('08081997');

    expect(await elemento.getProperty('value')).toBe('08/08/1997');
  });

  it('CL-05: "De" maior que "Até" mostra erro no "Até" e não pesquisa', async () => {
    await (await campo('id-lote-de')).setValue('5');
    await (await campo('id-lote-ate')).setValue('2');

    await pesquisar();

    expect(await errosDo('id-lote-ate')).toEqual(['Deve ser maior ou igual a De.']);
    expect(emitidos).toEqual([]);
  });

  it('CL-05: ID Lote aceita só inteiros a partir de 1', async () => {
    await (await campo('id-lote-de')).setValue('0');

    await pesquisar();

    expect(await errosDo('id-lote-de')).toEqual(['Inteiro maior que zero.']);
    expect(emitidos).toEqual([]);
  });

  it('CL-05: faixa de datas invertida mostra erro e não pesquisa', async () => {
    await (await data('data-entrada-de')).setValue('31/05/2026');
    await (await data('data-entrada-ate')).setValue('01/05/2026');

    await pesquisar();

    expect(await errosDo('data-entrada-ate')).toEqual(['Deve ser maior ou igual a De.']);
    expect(emitidos).toEqual([]);
  });

  it('DS-10: data inexistente mostra erro e não pesquisa', async () => {
    await (await data('data-entrada-de')).setValue('31/02/2026');

    await pesquisar();

    expect(await errosDo('data-entrada-de')).toEqual(['Data inválida.']);
    expect(emitidos).toEqual([]);
  });

  it('DS-04: os campos de faixa são lidos com o nome da faixa e do limite', () => {
    const elemento: HTMLElement = fixture.nativeElement;
    const idDe = elemento.querySelector('.id-lote-de');
    const nomes = (idDe?.getAttribute('aria-labelledby') ?? '')
      .split(' ')
      .map((id) => elemento.querySelector(`#${id}`)?.textContent?.trim());

    expect(nomes).toEqual(['ID Lote', 'De']);
  });

  describe('pesquisa automática', () => {
    beforeEach(async () => {
      TestBed.resetTestingModule();
      await criar(400);
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    /** Simula o navegador: altera o texto do campo e dispara o evento `input`. */
    function editar(classe: string, texto: string): void {
      const elemento: HTMLInputElement = fixture.nativeElement.querySelector(`.${classe}`);
      elemento.value = texto;
      elemento.dispatchEvent(new Event('input'));
    }

    it('CL-07: pesquisa 400 ms depois da última alteração', () => {
      editar('id-lote-de', '1');
      vi.advanceTimersByTime(300);
      editar('id-lote-de', '12');

      vi.advanceTimersByTime(399);
      expect(emitidos).toEqual([]);

      vi.advanceTimersByTime(1);
      expect(emitidos).toEqual([{ ...FILTROS_PADRAO, idLote: { de: 12, ate: null } }]);
    });

    it('CL-07: não pesquisa sozinho enquanto um filtro está inválido', () => {
      editar('id-lote-de', '0');

      vi.advanceTimersByTime(1000);

      expect(emitidos).toEqual([]);
    });

    it('CL-07: não repete a pesquisa se o filtro volta ao valor já pesquisado', () => {
      editar('id-lote-de', '5');
      vi.advanceTimersByTime(400);
      editar('id-lote-de', '56');
      editar('id-lote-de', '5');

      vi.advanceTimersByTime(400);

      expect(emitidos).toHaveLength(1);
    });

    it('CL-06: o botão Pesquisar consulta na hora, sem esperar o debounce', () => {
      editar('id-lote-de', '7');

      fixture.nativeElement.querySelector('button[type=submit]').click();
      expect(emitidos).toEqual([{ ...FILTROS_PADRAO, idLote: { de: 7, ate: null } }]);

      // A automática, que estava esperando, não repete a pesquisa que o botão já fez.
      vi.advanceTimersByTime(400);
      expect(emitidos).toHaveLength(1);
    });

    it('CL-06: clicar em Pesquisar de novo com os mesmos filtros pesquisa de novo', () => {
      const botao: HTMLButtonElement = fixture.nativeElement.querySelector('button[type=submit]');

      botao.click();
      botao.click();

      expect(emitidos).toHaveLength(2);
    });
  });
});
