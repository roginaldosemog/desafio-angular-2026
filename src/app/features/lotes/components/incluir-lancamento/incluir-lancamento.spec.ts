import '@angular/common/locales/global/pt';
import { HarnessLoader, TestElement } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatFormFieldHarness } from '@angular/material/form-field/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatRadioButtonHarness } from '@angular/material/radio/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { LancamentosApi } from '../../data-access/lancamentos-api';
import { ContaCorrente, Evento } from '../../models/cadastros';
import { DadosLancamento, Lancamento } from '../../models/lancamento';
import { Lote } from '../../models/lote';
import { criarLote } from '../../testing/fabricas';
import { DadosModalLancamento, IncluirLancamento } from './incluir-lancamento';

const CONTA: ContaCorrente = { numero: '44444', titular: 'Ana Paula Costa' };
const LOTE: Lote = criarLote({ id: 5, situacao: 'ABERTO' });
const EVENTO: Evento = {
  id: 102,
  codigo: 300,
  descricao: 'Centralizacao Titulo CSC Credito',
  dataInicio: '2019-12-31',
  dataFim: null,
};

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
      buscarEvento?: CadastrosApi['buscarEvento'];
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
      buscarEvento: opcoes.buscarEvento ?? ((id) => of(id === EVENTO.id ? EVENTO : null)),
      pesquisarEventos: () => of({ itens: [EVENTO], total: 1, pagina: 1, tamanhoPagina: 5 }),
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
  /** Botões do rodapé e da grade de lançamentos (os anexos têm botões com os mesmos nomes). */
  const botao = (texto: string) =>
    loader.getHarness(
      MatButtonHarness.with({ ancestor: 'mat-dialog-actions, .acoes-grade', text: texto }),
    );
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
    await (await campo('complemento-historico')).setValue('Ajuste mensal');
  }

  const DADOS_ESPERADOS: DadosLancamento = {
    contaCorrente: '44444',
    valorCentavos: 2000,
    historicoId: 1,
    estorno: false,
    documento: 'DOC-9',
    descricao: '',
    documentoCsc: {
      paId: 1,
      eventoId: null,
      complementoHistorico: 'Ajuste mensal',
      idDocumentoCsc: '',
    },
    anexos: [],
  };

  it('IL-01: tem o título "Incluir Lançamento"', async () => {
    await criar();

    expect(texto('[mat-dialog-title]')).toBe('Incluir Lançamento');
  });

  it('IL-02: agrupa os campos nas seções "Conta Corrente", "Documento CSC" e "Anexo"', async () => {
    await criar();

    const legendas = [...fixture.nativeElement.querySelectorAll('fieldset > legend')].map(
      (legenda: Element) => legenda.textContent?.trim(),
    );
    expect(legendas).toEqual(['Conta Corrente', 'Documento CSC', 'Anexo']);
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
    expect(obrigatorios).toBe(6);
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
    expect(await errosDo('complemento-historico')).toEqual(['Informe o complemento do histórico.']);
    expect(incluir).not.toHaveBeenCalled();
    expect(document.activeElement?.classList).toContain('conta-corrente');
  });

  it('IL-13: incluir com o formulário válido grava, mostra na grade e limpa o formulário', async () => {
    await criar();
    await preencherValido();

    await (await botao('Incluir')).click();

    expect(incluir).toHaveBeenCalledWith(null, DADOS_ESPERADOS);
    const grade = await loader.getHarness(
      MatTableHarness.with({ ancestor: 'app-grade-lancamentos' }),
    );
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
    await (await campo('complemento-historico')).setValue('Ajuste mensal');

    await (await botao('Incluir')).click();
    expect(incluir).not.toHaveBeenCalled();

    resposta.next(CONTA);
    resposta.complete();
    await fixture.whenStable();
    expect(incluir).toHaveBeenCalledTimes(1);
  });

  it('IL-18: Documento e Compl. Histórico só com espaços contam como vazios', async () => {
    await criar();
    await preencherValido();
    await (await campo('documento')).setValue('   ');
    await (await campo('complemento-historico')).setValue('   ');

    await (await botao('Incluir')).click();

    expect(await errosDo('documento')).toEqual(['Informe o documento.']);
    expect(await errosDo('complemento-historico')).toEqual(['Informe o complemento do histórico.']);
    expect(incluir).not.toHaveBeenCalled();
    expect(document.activeElement?.classList).toContain('documento');
  });

  it('IL-18: Conta Corrente só com espaços pede a conta, e não "só números"', async () => {
    await criar();

    await informarConta('   ');

    expect(await errosDo('conta-corrente')).toEqual(['Informe a conta corrente.']);
  });

  describe('IL-17: verificação no servidor', () => {
    const indisponivel = () => throwError(() => new Error('Servidor indisponível'));
    const dicasDo = async (classe: string) =>
      (
        await loader.getHarness(MatFormFieldHarness.with({ selector: `.campo-${classe}` }))
      ).getTextHints();

    it('IL-17: mostra "Verificando conta…" enquanto o servidor responde', async () => {
      const resposta = new Subject<ContaCorrente | null>();
      await criar({ buscarConta: () => resposta });

      await informarConta('44444');
      expect(await dicasDo('conta-corrente')).toEqual(['Verificando conta…']);

      resposta.next(CONTA);
      resposta.complete();
      expect(await dicasDo('conta-corrente')).toEqual([]);
    });

    it('IL-17: se a verificação da conta falhar, avisa e Incluir não fica travado', async () => {
      await criar({ buscarConta: indisponivel });
      await preencherValido();

      await (await botao('Incluir')).click();

      expect(await errosDo('conta-corrente')).toEqual([
        'Não foi possível verificar a conta. Tente de novo.',
      ]);
      expect(incluir).not.toHaveBeenCalled();
      expect(document.activeElement?.classList).toContain('conta-corrente');
    });

    it('IL-17: depois de uma falha, a lupa verifica a conta de novo', async () => {
      let tentativas = 0;
      await criar({ buscarConta: () => (++tentativas === 1 ? indisponivel() : of(CONTA)) });
      await informarConta('44444');

      await (await loader.getHarness(MatButtonHarness.with({ selector: '.lupa' }))).click();

      expect(texto('.titular')).toBe('Ana Paula Costa');
      expect(await errosDo('conta-corrente')).toEqual([]);
    });

    it('IL-17: o evento também avisa a verificação e a falha', async () => {
      const resposta = new Subject<Evento | null>();
      await criar({ buscarEvento: () => resposta });
      const evento = await campo('evento');
      await evento.setValue('102');
      await evento.blur();
      expect(await dicasDo('evento')).toEqual(['Verificando evento…']);

      resposta.error(new Error('Servidor indisponível'));

      expect(await errosDo('evento')).toEqual([
        'Não foi possível verificar o evento. Tente de novo.',
      ]);
    });
  });

  it('se a inclusão falhar, mantém o formulário preenchido para tentar de novo', async () => {
    await criar({ incluir: () => throwError(() => new Error('falha')) });
    await preencherValido();

    await (await botao('Incluir')).click();

    expect(await (await campo('documento')).getValue()).toBe('DOC-9');
    expect(
      await (
        await loader.getHarness(MatTableHarness.with({ ancestor: 'app-grade-lancamentos' }))
      ).getRows(),
    ).toHaveLength(0);
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
        const botoes = await loader.getAllHarnesses(
          MatButtonHarness.with({ ancestor: '.acoes-grade', text: nome }),
        );
        if (botoes.length > 0 && !(await botoes[0].isDisabled())) {
          resultado.push(nome);
        }
      }
      return resultado;
    };

    it('CL-16: num lote existente, mostra os lançamentos dele', async () => {
      await abrirLote();

      expect(listar).toHaveBeenCalledWith(LOTE.id);
      expect(
        await (
          await loader.getHarness(MatTableHarness.with({ ancestor: 'app-grade-lancamentos' }))
        ).getRows(),
      ).toHaveLength(2);
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
      expect(
        await loader.getAllHarnesses(
          MatButtonHarness.with({ ancestor: 'mat-dialog-actions', text: 'Incluir' }),
        ),
      ).toEqual([]);
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
      const grade = await loader.getHarness(
        MatTableHarness.with({ ancestor: 'app-grade-lancamentos' }),
      );
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
      expect(
        await (
          await loader.getHarness(MatTableHarness.with({ ancestor: 'app-grade-lancamentos' }))
        ).getRows(),
      ).toHaveLength(3);
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
      expect(
        await (
          await loader.getHarness(MatTableHarness.with({ ancestor: 'app-grade-lancamentos' }))
        ).getRows(),
      ).toHaveLength(1);
    });

    it('CL-18: no modo somente leitura, só é possível visualizar', async () => {
      await abrirLote(true);
      await selecionar('DOC-1');

      expect(await habilitados()).toEqual(['Visualizar']);
      expect(
        await loader.getAllHarnesses(
          MatButtonHarness.with({ ancestor: 'mat-dialog-actions', text: 'Incluir' }),
        ),
      ).toEqual([]);
      expect(await (await campo('documento')).isDisabled()).toBe(true);
      const lupa = await loader.getHarness(MatButtonHarness.with({ selector: '.lupa' }));
      expect(await lupa.isDisabled()).toBe(true);
      expect(texto('[mat-dialog-title]')).toBe('Visualizar Lote 5');
    });
  });

  describe('anexos', () => {
    /** Simula o navegador: escolhe arquivos no seletor e dispara o "change". */
    function escolherArquivos(...nomes: string[]) {
      const seletor: HTMLInputElement = fixture.nativeElement.querySelector('.seletor-arquivo');
      const arquivos = nomes.map(
        (nome) => new File(['conteúdo'], nome, { type: 'application/pdf' }),
      );
      Object.defineProperty(seletor, 'files', { value: arquivos, configurable: true });
      seletor.dispatchEvent(new Event('change'));
    }

    // Só as linhas de dados: a linha "Nenhum registro encontrado." também tem a classe mat-mdc-row.
    const linhasDeAnexo = () =>
      fixture.nativeElement.querySelectorAll('app-grade-anexos tr[mat-row]');
    const botaoAnexo = (texto: string) =>
      loader.getHarness(MatButtonHarness.with({ ancestor: '.acoes-anexo', text: texto }));

    it('IL-10: Incluir anexa os arquivos escolhidos, com nome e data de inclusão', async () => {
      await criar();

      escolherArquivos('comprovante.pdf', 'recibo.pdf');
      await fixture.whenStable();

      expect(linhasDeAnexo()).toHaveLength(2);
      expect(linhasDeAnexo()[0].textContent).toContain('comprovante.pdf');
    });

    it('IL-10: Visualizar e Excluir exigem um anexo escolhido; Excluir remove o anexo', async () => {
      await criar();
      escolherArquivos('comprovante.pdf', 'recibo.pdf');
      await fixture.whenStable();
      expect(await (await botaoAnexo('Excluir')).isDisabled()).toBe(true);

      const [primeiro] = await loader.getAllHarnesses(
        MatRadioButtonHarness.with({ ancestor: 'app-grade-anexos' }),
      );
      await primeiro.check();
      await (await botaoAnexo('Excluir')).click();

      expect(linhasDeAnexo()).toHaveLength(1);
      expect(linhasDeAnexo()[0].textContent).toContain('recibo.pdf');
    });

    it('IL-10: Visualizar mostra os dados do anexo num diálogo', async () => {
      await criar();
      escolherArquivos('comprovante.pdf');
      await fixture.whenStable();
      const [anexo] = await loader.getAllHarnesses(
        MatRadioButtonHarness.with({ ancestor: 'app-grade-anexos' }),
      );
      await anexo.check();

      await (await botaoAnexo('Visualizar')).click();

      const raiz = TestbedHarnessEnvironment.documentRootLoader(fixture);
      const dialogo = await raiz.getHarness(MatDialogHarness);
      expect(await dialogo.getContentText()).toContain('comprovante.pdf');
    });

    it('IL-10: os anexos vão no lançamento e o formulário volta sem anexos', async () => {
      await criar();
      await preencherValido();
      escolherArquivos('comprovante.pdf');
      await fixture.whenStable();

      await (await botao('Incluir')).click();

      const [, dados] = incluir.mock.calls[0];
      expect(dados.anexos.map((anexo) => anexo.nomeArquivo)).toEqual(['comprovante.pdf']);
      expect(linhasDeAnexo()).toHaveLength(0);
    });
  });

  describe('Documento CSC', () => {
    async function informarEvento(id: string) {
      const evento = await campo('evento');
      await evento.setValue(id);
      await evento.blur();
    }

    it('IL-08: ID Evento existente mostra a descrição ao lado', async () => {
      await criar();

      await informarEvento('102');

      expect(texto('.descricao-evento')).toBe('Centralizacao Titulo CSC Credito');
      expect(await errosDo('evento')).toEqual([]);
    });

    it('IL-08: ID Evento inexistente mostra "Evento não encontrado."', async () => {
      await criar();

      await informarEvento('999');

      expect(await errosDo('evento')).toEqual(['Evento não encontrado.']);
    });

    it('IL-08: a lupa abre a Pesquisa Evento e preenche o evento escolhido', async () => {
      await criar();

      await (await loader.getHarness(MatButtonHarness.with({ selector: '.lupa-evento' }))).click();
      const raiz = TestbedHarnessEnvironment.documentRootLoader(fixture);
      const [opcao] = await raiz.getAllHarnesses(MatRadioButtonHarness);
      await opcao.check();
      await (await raiz.getHarness(MatButtonHarness.with({ text: 'OK' }))).click();
      await fixture.whenStable();

      expect(await (await campo('evento')).getValue()).toBe('102');
      expect(texto('.descricao-evento')).toBe('Centralizacao Titulo CSC Credito');
    });

    it('IL-08: o evento escolhido vai no lançamento', async () => {
      await criar();
      await preencherValido();
      await informarEvento('102');

      await (await botao('Incluir')).click();

      expect(incluir).toHaveBeenCalledWith(null, {
        ...DADOS_ESPERADOS,
        documentoCsc: { ...DADOS_ESPERADOS.documentoCsc, eventoId: 102 },
      });
    });

    it('IL-09: Situação do documento é somente leitura, com "Aguardando Processamento CCO"', async () => {
      await criar();

      const situacao = await campo('situacao-csc');
      expect(await situacao.getValue()).toBe('Aguardando Processamento CCO');
      expect(await situacao.isReadonly()).toBe(true);
    });

    it('IL-09: ID Doc CSC é opcional', async () => {
      await criar();

      expect(await (await campo('id-documento-csc')).isRequired()).toBe(false);
    });
  });
});
