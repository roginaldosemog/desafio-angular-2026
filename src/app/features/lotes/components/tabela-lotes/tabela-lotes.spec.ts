import '@angular/common/locales/global/pt';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { Lote } from '../../models/lote';
import { criarLote } from '../../testing/fabricas';
import { TabelaLotes } from './tabela-lotes';

describe('TabelaLotes', () => {
  let fixture: ComponentFixture<TabelaLotes>;
  let loader: HarnessLoader;

  async function criar(lotes: readonly Lote[], selecionados: ReadonlySet<number> = new Set()) {
    TestBed.configureTestingModule({
      imports: [TabelaLotes],
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    fixture = TestBed.createComponent(TabelaLotes);
    fixture.componentRef.setInput('lotes', lotes);
    fixture.componentRef.setInput('selecionados', selecionados);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  }

  /** Caixas de seleção: a primeira é a do cabeçalho; as demais, uma por linha. */
  const caixas = () => loader.getAllHarnesses(MatCheckboxHarness);
  const selecionados = () => [...fixture.componentInstance.selecionados()];
  /** O pt-BR usa espaço não separável em "R$ 1.000,00"; nos testes, comparo com espaço comum. */
  const normalizar = (textos: string[]) => textos.map((texto) => texto.replace(/\s/g, ' '));

  it('CL-10: mostra as colunas na ordem da referência', async () => {
    await criar([criarLote()]);

    const tabela = await loader.getHarness(MatTableHarness);
    const [cabecalho] = await tabela.getHeaderRows();

    expect(await cabecalho.getCellTextByIndex()).toEqual([
      '',
      'ID Lote',
      'Data Entrada',
      'Valor',
      'Quant. Lançamentos',
      'Usuário Registro',
      'Usuário Aprovação',
      'Situação Lote',
      'Data/Hora Situação Lote',
    ]);
  });

  it('CL-10: formata valor em reais e datas no padrão pt-BR', async () => {
    await criar([
      criarLote({
        id: 2,
        dataEntrada: '2026-04-26',
        valorCentavos: 100000,
        quantidadeLancamentos: 1,
        usuarioRegistro: 'gearqc0300_00',
        usuarioAprovacao: null,
        situacao: 'ABERTO',
        dataHoraSituacao: '2026-04-27T12:35:11',
      }),
    ]);

    const tabela = await loader.getHarness(MatTableHarness);
    const [linha] = await tabela.getCellTextByIndex();

    expect(normalizar(linha)).toEqual([
      '',
      '2',
      '26/04/2026',
      'R$ 1.000,00',
      '1',
      'gearqc0300_00',
      '',
      'Aberto',
      '27/04/2026, 12:35:11',
    ]);
  });

  it('CL-11: sem lotes, mostra "Nenhum registro encontrado." e desabilita a seleção geral', async () => {
    await criar([]);

    expect(fixture.nativeElement.textContent).toContain('Nenhum registro encontrado.');
    const [todos] = await caixas();
    expect(await todos.isDisabled()).toBe(true);
  });

  it('CL-12: marca e desmarca um lote', async () => {
    await criar([criarLote({ id: 1 }), criarLote({ id: 2 })]);
    const [, , segundo] = await caixas();

    await segundo.check();
    expect(selecionados()).toEqual([2]);

    await segundo.uncheck();
    expect(selecionados()).toEqual([]);
  });

  it('DS-15: destaca a linha selecionada', async () => {
    await criar([criarLote({ id: 1 }), criarLote({ id: 2 })], new Set([2]));

    const linhas = fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');

    expect([...linhas].map((linha: Element) => linha.classList.contains('selecionada'))).toEqual([
      false,
      true,
    ]);
  });

  it('CL-12: a caixa do cabeçalho seleciona todos os lotes da página', async () => {
    await criar([criarLote({ id: 1 }), criarLote({ id: 2 }), criarLote({ id: 3 })]);
    const [todos] = await caixas();

    await todos.check();

    expect(selecionados()).toEqual([1, 2, 3]);
  });

  it('CL-12: indica seleção parcial e, com todos marcados, desmarca todos', async () => {
    await criar([criarLote({ id: 1 }), criarLote({ id: 2 })], new Set([1]));
    const [todos] = await caixas();
    expect(await todos.isIndeterminate()).toBe(true);

    await todos.check();
    expect(selecionados()).toEqual([1, 2]);

    await todos.uncheck();
    expect(selecionados()).toEqual([]);
  });

  it('a seleção vinda da página marca as caixas correspondentes', async () => {
    await criar([criarLote({ id: 1 }), criarLote({ id: 2 })], new Set([2]));
    const [, primeiro, segundo] = await caixas();

    expect(await primeiro.isChecked()).toBe(false);
    expect(await segundo.isChecked()).toBe(true);
  });

  it('DS-26: cada caixa tem um nome acessível', async () => {
    await criar([criarLote({ id: 7 })]);
    const [todos, lote] = await caixas();

    expect(await todos.getAriaLabel()).toBe('Selecionar todos os lotes da página');
    expect(await lote.getAriaLabel()).toBe('Selecionar lote 7');
  });

  it('DS-17: a área da tabela rola na horizontal e é alcançável pelo teclado', async () => {
    await criar([criarLote()]);

    const area: HTMLElement = fixture.nativeElement.querySelector('.area-rolavel');

    expect(area.getAttribute('role')).toBe('region');
    expect(area.getAttribute('aria-label')).toBe('Lotes encontrados');
    expect(area.tabIndex).toBe(0);
  });
});
