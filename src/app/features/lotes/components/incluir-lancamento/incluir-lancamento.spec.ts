import '@angular/common/locales/global/pt';
import { HarnessLoader, TestElement } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { LancamentosApi } from '../../data-access/lancamentos-api';
import { ContaCorrente } from '../../models/cadastros';
import { DadosLancamento, Lancamento } from '../../models/lancamento';
import { Lote } from '../../models/lote';
import { criarLote } from '../../testing/fabricas';
import { DadosModalLancamento, IncluirLancamento } from './incluir-lancamento';

const CONTA: ContaCorrente = { numero: '44444', titular: 'Ana Paula Costa' };
const LOTE: Lote = criarLote({ id: 5, situacao: 'ABERTO' });

/** O que o "servidor" devolve: os dados enviados mais o que ele define. */
function gravado(loteId: number | null, dados: DadosLancamento, id: number): Lancamento {
  return {
    ...dados,
    id,
    loteId: loteId ?? 50,
    titular: CONTA.titular,
    situacao: 'PENDENTE',
    situacaoDocumentoCsc: 'AGUARDANDO_PROCESSAMENTO_CCO',
  };
}

describe('IncluirLancamento', () => {
  let fixture: ComponentFixture<IncluirLancamento>;
  let loader: HarnessLoader;
  let incluir: ReturnType<typeof vi.fn<LancamentosApi['incluir']>>;
  let alterar: ReturnType<typeof vi.fn<LancamentosApi['alterar']>>;
  let excluir: ReturnType<typeof vi.fn<LancamentosApi['excluir']>>;
  let listar: ReturnType<typeof vi.fn<LancamentosApi['listar']>>;

  async function criar(
    opcoes: {
      buscarConta?: (numero: string) => Observable<ContaCorrente | null>;
      incluir?: LancamentosApi['incluir'];
      dados?: DadosModalLancamento;
      doLote?: readonly Lancamento[];
    } = {},
  ) {
    let ids = 100;
    incluir = vi.fn<LancamentosApi['incluir']>(
      opcoes.incluir ?? ((loteId, dados) => of(gravado(loteId, dados, ++ids))),
    );
    alterar = vi.fn<LancamentosApi['alterar']>((id, dados) => of(gravado(LOTE.id, dados, id)));
    excluir = vi.fn<LancamentosApi['excluir']>(() => of(undefined));
    listar = vi.fn<LancamentosApi['listar']>(() => of(opcoes.doLote ?? []));
    const cadastros: CadastrosApi = {
      listarInstituicoes: () => of([]),
      buscarContaCorrente:
        opcoes.buscarConta ?? ((numero) => of(numero === CONTA.numero ? CONTA : null)),
      listarHistoricos: () => of([{ id: 1, descricao: 'Lançamento Manual' }]),
      listarPontosAtendimento: () => of([{ id: 1, nome: 'Cooperativa' }]),
    };
    TestBed.configureTestingModule({
      imports: [IncluirLancamento],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: MAT_DIALOG_DATA, useValue: opcoes.dados ?? { lote: null } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: CadastrosApi, useValue: cadastros },
        {
          provide: LancamentosApi,
          useValue: { incluir, alterar, excluir, listar } satisfies LancamentosApi,
        },
      ],
    });
    fixture = TestBed.createComponent(IncluirLancamento);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  }

  const campo = (classe: string) =>
    loader.getHarness(MatInputHarness.with({ selector: `.${classe}` }));
  const select = (classe: string) =>
    loader.getHarness(MatSelectHarness.with({ selector: `.${classe}` }));
  const errosDo = async (classe: string) =>
    (
      await loader.getHarness(MatFormFieldHarness.with({ selector: `.campo-${classe}` }))
    ).getTextErrors();
  const botao = (texto: string) => loader.getHarness(MatButtonHarness.with({ text: texto }));
  const texto = (seletor: string) =>
    (fixture.nativeElement.querySelector(seletor) as HTMLElement | null)?.textContent?.trim();

  /** Conta: digita e sai do campo, que é quando a conta é validada (updateOn: 'blur'). */
  async function informarConta(numero: string) {
    const conta = await campo('conta-corrente');
    await conta.setValue(numero);
    await conta.blur();
  }

  /** Digita como o usuário: o setValue do harness esconderia a formatação do campo monetário. */
  async function informarValor(digitos: string) {
    const valor: TestElement = await (await campo('valor')).host();
    await valor.sendKeys(digitos);
  }

  async function escolher(classe: string, opcao: string) {
    const lista = await select(classe);
    await lista.open();
    await lista.clickOptions({ text: opcao });
  }

  async function preencherValido() {
    await informarConta('44444');
    await informarValor('2000');
    await escolher('historico', 'Lançamento Manual');
    await (await campo('documento')).setValue('DOC-9');
    await escolher('pa', 'Cooperativa');
  }

  const DADOS_ESPERADOS: DadosLancamento = {
    contaCorrente: '44444',
    valorCentavos: 2000,
    historicoId: 1,
    estorno: false,
    documento: 'DOC-9',
    descricao: '',
    documentoCsc: { paId: 1, eventoId: null, complementoHistorico: '', idDocumentoCsc: '' },
    anexos: [],
  };

  it('IL-01: tem o título "Incluir Lançamento"', async () => {
    await criar();

    expect(texto('[mat-dialog-title]')).toBe('Incluir Lançamento');
  });

  it('IL-02: agrupa os campos nas seções "Conta Corrente" e "Documento CSC"', async () => {
    await criar();

    const legendas = [...fixture.nativeElement.querySelectorAll('fieldset > legend')].map(
      (legenda: Element) => legenda.textContent?.trim(),
    );
    expect(legendas).toEqual(['Conta Corrente', 'Documento CSC']);
  });

  it('IL-03: conta encontrada mostra o titular ao lado', async () => {
    await criar();

    await informarConta('44444');

    expect(texto('.titular')).toBe('Ana Paula Costa');
    expect(await errosDo('conta-corrente')).toEqual([]);
  });

  it('IL-03: conta inexistente mostra "Conta corrente não encontrada."', async () => {
    await criar();

    await informarConta('99999');

    expect(await errosDo('conta-corrente')).toEqual(['Conta corrente não encontrada.']);
    expect(texto('.titular')).toBe('');
  });

  it('IL-03: a lupa busca a conta digitada', async () => {
    await criar();
    await (await campo('conta-corrente')).setValue('44444');

    await (await loader.getHarness(MatButtonHarness.with({ selector: '.lupa' }))).click();

    expect(texto('.titular')).toBe('Ana Paula Costa');
  });

  it('IL-06: Estorno começa desmarcado e Situação é somente leitura, com "Pendente"', async () => {
    await criar();

    expect(
      await (await loader.getHarness(MatCheckboxHarness.with({ label: 'Estorno' }))).isChecked(),
    ).toBe(false);
    const situacao = await campo('situacao');
    expect(await situacao.getValue()).toBe('Pendente');
    expect(await situacao.isReadonly()).toBe(true);
  });

  it('IL-11: marca os obrigatórios com * e os informa ao leitor de tela', async () => {
    await criar();

    const obrigatorios = [...fixture.nativeElement.querySelectorAll('label .obrigatorio')].length;
    expect(obrigatorios).toBe(5);
    expect(await (await campo('documento')).isRequired()).toBe(true);
  });

  it('IL-12: incluir com o formulário vazio mostra os erros, não inclui e foca o primeiro campo', async () => {
    await criar();

    await (await botao('Incluir')).click();

    expect(await errosDo('conta-corrente')).toEqual(['Informe a conta corrente.']);
    expect(await errosDo('valor')).toEqual(['Informe o valor.']);
    expect(await errosDo('historico')).toEqual(['Escolha o histórico.']);
    expect(await errosDo('documento')).toEqual(['Informe o documento.']);
    expect(await errosDo('pa')).toEqual(['Escolha o PA.']);
    expect(incluir).not.toHaveBeenCalled();
    expect(document.activeElement?.classList).toContain('conta-corrente');
  });

  it('IL-13: incluir com o formulário válido grava, mostra na grade e limpa o formulário', async () => {
    await criar();
    await preencherValido();

    await (await botao('Incluir')).click();

    expect(incluir).toHaveBeenCalledWith(null, DADOS_ESPERADOS);
    const grade = await loader.getHarness(MatTableHarness);
    expect(await grade.getRows()).toHaveLength(1);
    expect(await (await campo('conta-corrente')).getValue()).toBe('');
    expect(await errosDo('conta-corrente')).toEqual([]);
  });

  it('CL-15: depois do primeiro lançamento, os seguintes vão para o lote criado', async () => {
    await criar();
    await preencherValido();
    await (await botao('Incluir')).click();

    await preencherValido();
    await (await botao('Incluir')).click();

    expect(incluir.mock.calls.map(([loteId]) => loteId)).toEqual([null, 50]);
  });

  it('IL-13: com "Manter dados na tela", o formulário continua preenchido', async () => {
    await criar();
    await preencherValido();
    await (
      await loader.getHarness(MatCheckboxHarness.with({ label: 'Manter dados na tela' }))
    ).check();

    await (await botao('Incluir')).click();

    expect(await (await campo('conta-corrente')).getValue()).toBe('44444');
    expect(await (await campo('documento')).getValue()).toBe('DOC-9');
  });

  it('IL-03: se a conta ainda está sendo validada, espera a resposta antes de incluir', async () => {
    const resposta = new Subject<ContaCorrente | null>();
    await criar({ buscarConta: () => resposta });
    await informarConta('44444');
    await informarValor('2000');
    await escolher('historico', 'Lançamento Manual');
    await (await campo('documento')).setValue('DOC-9');
    await escolher('pa', 'Cooperativa');

    await (await botao('Incluir')).click();
    expect(incluir).not.toHaveBeenCalled();

    resposta.next(CONTA);
    resposta.complete();
    await fixture.whenStable();
    expect(incluir).toHaveBeenCalledTimes(1);
  });

  it('se a inclusão falhar, mantém o formulário preenchido para tentar de novo', async () => {
    await criar({ incluir: () => throwError(() => new Error('falha')) });
    await preencherValido();

    await (await botao('Incluir')).click();

    expect(await (await campo('documento')).getValue()).toBe('DOC-9');
    expect(await (await loader.getHarness(MatTableHarness)).getRows()).toHaveLength(0);
  });

  describe('lançamentos do lote', () => {
    const PRIMEIRO = gravado(LOTE.id, { ...DADOS_ESPERADOS, documento: 'DOC-1' }, 1);
    const SEGUNDO = gravado(
      LOTE.id,
      { ...DADOS_ESPERADOS, documento: 'DOC-2', valorCentavos: 900 },
      2,
    );
    const abrirLote = (somenteLeitura = false) =>
      criar({ dados: { lote: LOTE, somenteLeitura }, doLote: [PRIMEIRO, SEGUNDO] });
    const raiz = () => TestbedHarnessEnvironment.documentRootLoader(fixture);

    /** O aria-label do mat-checkbox fica no input interno: a busca é pela API do harness. */
    async function selecionar(documento: string) {
      for (const caixa of await loader.getAllHarnesses(MatCheckboxHarness)) {
        if ((await caixa.getAriaLabel()) === `Selecionar lançamento ${documento}`) {
          await caixa.check();
          return;
        }
      }
      throw new Error(`Lançamento ${documento} não está na grade.`);
    }

    const habilitados = async () => {
      const resultado: string[] = [];
      for (const nome of ['Visualizar', 'Alterar', 'Excluir', 'Duplicar']) {
        const botoes = await loader.getAllHarnesses(MatButtonHarness.with({ text: nome }));
        if (botoes.length > 0 && !(await botoes[0].isDisabled())) {
          resultado.push(nome);
        }
      }
      return resultado;
    };

    it('CL-16: num lote existente, mostra os lançamentos dele', async () => {
      await abrirLote();

      expect(listar).toHaveBeenCalledWith(LOTE.id);
      expect(await (await loader.getHarness(MatTableHarness)).getRows()).toHaveLength(2);
    });

    it('IL-14: as ações da grade exigem exatamente um lançamento selecionado', async () => {
      await abrirLote();
      expect(await habilitados()).toEqual([]);

      await selecionar('DOC-1');
      expect(await habilitados()).toEqual(['Visualizar', 'Alterar', 'Excluir', 'Duplicar']);

      await selecionar('DOC-2');
      expect(await habilitados()).toEqual([]);
    });

    it('IL-15: Visualizar carrega o lançamento sem permitir edição', async () => {
      await abrirLote();
      await selecionar('DOC-1');

      await (await botao('Visualizar')).click();

      const documento = await campo('documento');
      expect(await documento.getValue()).toBe('DOC-1');
      expect(await documento.isDisabled()).toBe(true);
      expect(await loader.getAllHarnesses(MatButtonHarness.with({ text: 'Incluir' }))).toEqual([]);
    });

    it('IL-15: Alterar carrega para edição e o botão principal salva a alteração', async () => {
      await abrirLote();
      await selecionar('DOC-1');
      await (await botao('Alterar')).click();
      await (await campo('documento')).setValue('DOC-1-ALTERADO');

      await (await botao('Salvar alteração')).click();

      expect(alterar).toHaveBeenCalledWith(
        PRIMEIRO.id,
        expect.objectContaining({ documento: 'DOC-1-ALTERADO' }),
      );
      const grade = await loader.getHarness(MatTableHarness);
      expect((await grade.getCellTextByColumnName())['documento'].text).toEqual([
        'DOC-1-ALTERADO',
        'DOC-2',
      ]);
      expect(await (await campo('documento')).getValue()).toBe('');
      expect(await botao('Incluir')).toBeTruthy();
    });

    it('IL-15: Duplicar carrega uma cópia que é incluída como lançamento novo', async () => {
      await abrirLote();
      await selecionar('DOC-2');
      await (await botao('Duplicar')).click();
      expect(await (await campo('documento')).getValue()).toBe('DOC-2');

      await (await botao('Incluir')).click();

      expect(incluir).toHaveBeenCalledWith(
        LOTE.id,
        expect.objectContaining({ documento: 'DOC-2', valorCentavos: 900 }),
      );
      expect(await (await loader.getHarness(MatTableHarness)).getRows()).toHaveLength(3);
    });

    it('IL-15: Excluir pede confirmação e remove o lançamento da grade', async () => {
      await abrirLote();
      await selecionar('DOC-1');

      await (await botao('Excluir')).click();
      const confirmar = await raiz().getHarness(
        MatButtonHarness.with({ text: 'Excluir lançamento' }),
      );
      await confirmar.click();
      await fixture.whenStable();

      expect(excluir).toHaveBeenCalledWith(PRIMEIRO.id);
      expect(await (await loader.getHarness(MatTableHarness)).getRows()).toHaveLength(1);
    });

    it('CL-18: no modo somente leitura, só é possível visualizar', async () => {
      await abrirLote(true);
      await selecionar('DOC-1');

      expect(await habilitados()).toEqual(['Visualizar']);
      expect(await loader.getAllHarnesses(MatButtonHarness.with({ text: 'Incluir' }))).toEqual([]);
      expect(await (await campo('documento')).isDisabled()).toBe(true);
      const lupa = await loader.getHarness(MatButtonHarness.with({ selector: '.lupa' }));
      expect(await lupa.isDisabled()).toBe(true);
      expect(texto('[mat-dialog-title]')).toBe('Visualizar Lote 5');
    });
  });
});
