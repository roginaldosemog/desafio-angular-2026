import '@angular/common/locales/global/pt';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { Lancamento } from '../../models/lancamento';
import { GradeLancamentos } from './grade-lancamentos';

const HISTORICOS = [
  { id: 1, descricao: 'Lançamento Manual' },
  { id: 3, descricao: 'Tarifa Bancária' },
];

function lancamento(variacoes: Partial<Lancamento> = {}): Lancamento {
  return {
    id: 1,
    loteId: 2,
    contaCorrente: '44444',
    titular: 'Ana Paula Costa',
    valorCentavos: 100000,
    historicoId: 1,
    estorno: false,
    documento: 'DOC-0003',
    descricao: '',
    situacao: 'PENDENTE',
    documentoCsc: { paId: 1, eventoId: 102, complementoHistorico: '', idDocumentoCsc: '' },
    situacaoDocumentoCsc: 'AGUARDANDO_PROCESSAMENTO_CCO',
    anexos: [],
    ...variacoes,
  };
}

describe('GradeLancamentos', () => {
  let fixture: ComponentFixture<GradeLancamentos>;

  async function criar(lancamentos: readonly Lancamento[]) {
    TestBed.configureTestingModule({
      imports: [GradeLancamentos],
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    fixture = TestBed.createComponent(GradeLancamentos);
    fixture.componentRef.setInput('lancamentos', lancamentos);
    fixture.componentRef.setInput('historicos', HISTORICOS);
    await fixture.whenStable();
    return TestbedHarnessEnvironment.loader(fixture).getHarness(MatTableHarness);
  }

  it('IL-14: mostra as colunas da grade de lançamentos', async () => {
    const tabela = await criar([lancamento()]);
    const [cabecalho] = await tabela.getHeaderRows();

    // "Seleção" existe só para o leitor de tela: a coluna das caixas precisa de um nome.
    expect(await cabecalho.getCellTextByIndex()).toEqual([
      'Seleção',
      'Conta Corrente',
      'Titular',
      'Histórico',
      'Valor',
      'Documento',
      'Situação',
    ]);
  });

  it('IL-14: mostra o histórico pelo nome, o valor em reais e a situação por extenso', async () => {
    const tabela = await criar([lancamento({ historicoId: 3, valorCentavos: 12990 })]);

    const [linha] = await tabela.getCellTextByIndex();

    expect(linha.map((texto) => texto.replace(/\s/g, ' '))).toEqual([
      '',
      '44444',
      'Ana Paula Costa',
      'Tarifa Bancária',
      'R$ 129,90',
      'DOC-0003',
      'Pendente',
    ]);
  });

  it('sem lançamentos, avisa que nenhum foi incluído', async () => {
    await criar([]);

    expect(fixture.nativeElement.textContent).toContain('Nenhum lançamento incluído.');
  });

  it('IL-14: marca e desmarca um lançamento', async () => {
    await criar([lancamento({ id: 1 }), lancamento({ id: 2, documento: 'DOC-2' })]);
    const caixas =
      await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatCheckboxHarness);

    await caixas[1].check();
    expect([...fixture.componentInstance.selecionados()]).toEqual([2]);

    await caixas[1].uncheck();
    expect([...fixture.componentInstance.selecionados()]).toEqual([]);
  });

  it('DS-26: cada caixa tem um nome acessível com o documento do lançamento', async () => {
    await criar([lancamento({ documento: 'DOC-0003' })]);
    const [caixa] =
      await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(MatCheckboxHarness);

    expect(await caixa.getAriaLabel()).toBe('Selecionar lançamento DOC-0003');
  });
});
