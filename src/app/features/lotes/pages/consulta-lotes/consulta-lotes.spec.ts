import '@angular/common/locales/global/pt';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { defer, Observable, of, Subject, throwError } from 'rxjs';
import { provideDatasPtBr } from '../../../../shared/datas/datas-pt-br';
import { Pagina } from '../../../../shared/models/pagina';
import { FILTROS_PADRAO } from '../../components/filtros-lotes/filtros-lotes';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { LotesApi } from '../../data-access/lotes-api';
import { Instituicao } from '../../models/cadastros';
import { Lote } from '../../models/lote';
import { criarLote } from '../../testing/fabricas';
import { ConsultaLotes } from './consulta-lotes';

const INSTITUICOES: readonly Instituicao[] = [
  { codigo: '0001', nome: 'SICOOB' },
  { codigo: '0002', nome: 'SICOOB CENTRAL' },
];

function pagina(itens: readonly Lote[], total = itens.length): Pagina<Lote> {
  return { itens, total, pagina: 1, tamanhoPagina: 10 };
}

const lotesDe = (primeiro: number, quantidade: number) =>
  Array.from({ length: quantidade }, (_, indice) => criarLote({ id: primeiro + indice }));

describe('ConsultaLotes', () => {
  let fixture: ComponentFixture<ConsultaLotes>;
  let loader: HarnessLoader;
  let pesquisar: ReturnType<typeof vi.fn<LotesApi['pesquisar']>>;
  let enviar: ReturnType<typeof vi.fn<LotesApi['enviar']>>;
  let confirmar: ReturnType<typeof vi.fn<LotesApi['confirmar']>>;
  let excluir: ReturnType<typeof vi.fn<LotesApi['excluir']>>;

  async function criar(
    opcoes: {
      instituicoes?: Observable<readonly Instituicao[]>;
      lotes?: readonly Lote[];
      total?: number;
      pesquisar?: LotesApi['pesquisar'];
      enviar?: LotesApi['enviar'];
      /** false quando a resposta fica pendente: o whenStable esperaria por ela. */
      esperarEstabilizar?: boolean;
    } = {},
  ) {
    const cadastros: CadastrosApi = {
      listarInstituicoes: () => opcoes.instituicoes ?? of(INSTITUICOES),
    };
    pesquisar = vi.fn<LotesApi['pesquisar']>(
      opcoes.pesquisar ?? (() => of(pagina(opcoes.lotes ?? [], opcoes.total))),
    );
    enviar = vi.fn<LotesApi['enviar']>(opcoes.enviar ?? (() => of(undefined)));
    confirmar = vi.fn<LotesApi['confirmar']>(() => of(undefined));
    excluir = vi.fn<LotesApi['excluir']>(() => of(undefined));
    TestBed.configureTestingModule({
      imports: [ConsultaLotes],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        // Sem animações, o diálogo fecha na hora e o teste não depende de tempo.
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        provideDatasPtBr(),
        { provide: CadastrosApi, useValue: cadastros },
        {
          provide: LotesApi,
          useValue: { pesquisar, enviar, confirmar, excluir } satisfies LotesApi,
        },
      ],
    });
    fixture = TestBed.createComponent(ConsultaLotes);
    loader = TestbedHarnessEnvironment.loader(fixture);
    if (opcoes.esperarEstabilizar === false) {
      fixture.detectChanges();
    } else {
      await fixture.whenStable();
    }
  }

  it('CL-04: mostra os filtros com as instituições do serviço de cadastros', async () => {
    await criar();

    const instituicao = await loader.getHarness(
      MatSelectHarness.with({ selector: '.instituicao' }),
    );

    expect(await instituicao.getValueText()).toBe('0002 - SICOOB CENTRAL');
  });

  it('mantém os filtros utilizáveis se a lista de instituições falhar', async () => {
    await criar({ instituicoes: throwError(() => new Error('falha')) });

    const responsavel = await loader.getHarness(
      MatInputHarness.with({ selector: '.instituicao-responsavel' }),
    );

    expect(await responsavel.getValue()).toBe('0001');
  });

  it('CL-06: ao abrir, pesquisa com os filtros padrão e mostra os lotes', async () => {
    await criar({ lotes: [criarLote({ id: 1 }), criarLote({ id: 2 })] });

    expect(pesquisar).toHaveBeenCalledWith(FILTROS_PADRAO, 1, 10);
    const tabela = await loader.getHarness(MatTableHarness);
    expect(await tabela.getRows()).toHaveLength(2);
  });

  it('CL-12: pesquisar de novo limpa a seleção', async () => {
    await criar({ lotes: [criarLote({ id: 1 }), criarLote({ id: 2 })] });
    const [, primeiro] = await loader.getAllHarnesses(MatCheckboxHarness);
    await primeiro.check();

    await (await loader.getHarness(MatButtonHarness.with({ text: 'Pesquisar' }))).click();

    const caixas = await loader.getAllHarnesses(MatCheckboxHarness);
    const marcadas = await Promise.all(caixas.map((caixa) => caixa.isChecked()));
    expect(marcadas).toEqual([false, false, false]);
    expect(pesquisar).toHaveBeenCalledTimes(2);
  });

  describe('paginação', () => {
    const botao = (nome: string): HTMLButtonElement =>
      fixture.nativeElement.querySelector(`button[aria-label="${nome}"]`);
    const linhas = () => fixture.nativeElement.querySelectorAll('tr.mat-mdc-row');

    it('CL-13: mostra uma página para cada 10 lotes encontrados', async () => {
      await criar({ lotes: lotesDe(1, 10), total: 18 });

      expect(botao('Página 1')).toBeTruthy();
      expect(botao('Página 2')).toBeTruthy();
      expect(botao('Página 3')).toBeNull();
    });

    it('CL-12, CL-13: trocar de página pesquisa a página pedida com os mesmos filtros e limpa a seleção', async () => {
      await criar({ lotes: lotesDe(1, 10), total: 18 });
      const [, primeiro] = await loader.getAllHarnesses(MatCheckboxHarness);
      await primeiro.check();

      botao('Página 2').click();
      await fixture.whenStable();

      expect(pesquisar).toHaveBeenLastCalledWith(FILTROS_PADRAO, 2, 10);
      const caixas = await loader.getAllHarnesses(MatCheckboxHarness);
      const marcadas = await Promise.all(caixas.map((caixa) => caixa.isChecked()));
      expect(marcadas.some(Boolean)).toBe(false);
    });

    it('mantém os lotes atuais na tela enquanto a próxima página carrega', async () => {
      const segunda = new Subject<Pagina<Lote>>();
      await criar({
        pesquisar: (_filtros, numero) => (numero === 1 ? of(pagina(lotesDe(1, 10), 18)) : segunda),
      });

      botao('Página 2').click();
      // Sem whenStable: ele esperaria a resposta, que o Subject ainda está segurando.
      fixture.detectChanges();
      expect(linhas()).toHaveLength(10);
      expect(botao('Página 2')).toBeTruthy();

      segunda.next(pagina(lotesDe(11, 8), 18));
      segunda.complete();
      await fixture.whenStable();
      expect(linhas()).toHaveLength(8);
    });
  });

  describe('carregamento e erro', () => {
    const elemento = (seletor: string): HTMLElement | null =>
      fixture.nativeElement.querySelector(seletor);
    const anuncio = () => elemento('.anuncio')?.textContent?.trim();
    const falha = () => throwError(() => new Error('Falha simulada.'));

    /**
     * O `retry` não chama `pesquisar()` de novo: ele se inscreve outra vez no mesmo Observable.
     * Por isso o dublê usa `defer`, que decide a resposta a cada inscrição (como uma chamada HTTP),
     * e conta as tentativas, não as chamadas.
     */
    let tentativas: number;
    const respondendo = (resposta: (tentativa: number) => Observable<Pagina<Lote>>) => () =>
      defer(() => resposta(++tentativas));

    beforeEach(() => {
      tentativas = 0;
    });

    it('CL-08: mostra e anuncia o carregamento enquanto pesquisa', async () => {
      const resposta = new Subject<Pagina<Lote>>();
      await criar({ pesquisar: () => resposta, esperarEstabilizar: false });

      expect(elemento('mat-progress-bar')).toBeTruthy();
      expect(elemento('.resultados')?.getAttribute('aria-busy')).toBe('true');
      expect(anuncio()).toBe('Pesquisando lotes…');
      expect(elemento('table')?.textContent).not.toContain('Nenhum registro encontrado.');

      resposta.next(pagina(lotesDe(1, 10), 18));
      resposta.complete();
      await fixture.whenStable();

      expect(elemento('mat-progress-bar')).toBeNull();
      expect(elemento('.resultados')?.getAttribute('aria-busy')).toBe('false');
      expect(anuncio()).toBe('18 lotes encontrados.');
    });

    it('CL-09: tenta de novo uma vez e, se falhar, mostra o erro com "Tentar novamente"', async () => {
      await criar({ pesquisar: respondendo(falha) });

      expect(tentativas).toBe(2);
      expect(elemento('[role=alert]')?.textContent).toContain(
        'Não foi possível pesquisar os lotes.',
      );
      expect(
        await loader.getHarness(MatButtonHarness.with({ text: 'Tentar novamente' })),
      ).toBeTruthy();
      expect(elemento('table')).toBeNull();
    });

    it('CL-09: uma falha passageira não chega ao usuário', async () => {
      await criar({
        pesquisar: respondendo((tentativa) =>
          tentativa === 1 ? falha() : of(pagina(lotesDe(1, 3))),
        ),
      });

      expect(tentativas).toBe(2);
      expect(elemento('[role=alert]')).toBeNull();
      expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row')).toHaveLength(3);
    });

    it('CL-09: "Tentar novamente" refaz a pesquisa e mostra os lotes', async () => {
      await criar({
        pesquisar: respondendo((tentativa) =>
          tentativa <= 2 ? falha() : of(pagina(lotesDe(1, 3))),
        ),
      });

      await (await loader.getHarness(MatButtonHarness.with({ text: 'Tentar novamente' }))).click();
      await fixture.whenStable();

      expect(elemento('[role=alert]')).toBeNull();
      expect(fixture.nativeElement.querySelectorAll('tr.mat-mdc-row')).toHaveLength(3);
    });

    it('CL-07: descarta a resposta de uma pesquisa antiga que chega atrasada', async () => {
      const antiga = new Subject<Pagina<Lote>>();
      const nova = new Subject<Pagina<Lote>>();
      const respostas = [antiga, nova];
      await criar({ pesquisar: () => respostas.shift() ?? nova, esperarEstabilizar: false });

      // Uma segunda pesquisa começa antes de a primeira responder.
      elemento('button[type=submit]')?.click();
      fixture.detectChanges();
      nova.next(pagina([criarLote({ id: 2 })]));
      nova.complete();
      antiga.next(pagina([criarLote({ id: 1 })]));
      antiga.complete();
      await fixture.whenStable();

      const ids = [...fixture.nativeElement.querySelectorAll('tr.mat-mdc-row td:nth-child(2)')].map(
        (celula: Element) => celula.textContent?.trim(),
      );
      expect(ids).toEqual(['2']);
    });
  });

  describe('ações', () => {
    const LOTES = [
      criarLote({ id: 1, situacao: 'ABERTO' }),
      criarLote({ id: 2, situacao: 'ABERTO' }),
      criarLote({ id: 3, situacao: 'ENVIADO' }),
      criarLote({ id: 4, situacao: 'ABERTO', justificativa: 'Reenviar o comprovante.' }),
    ];
    const raiz = () => TestbedHarnessEnvironment.documentRootLoader(fixture);

    /** Marca os lotes pelo ID; as caixas seguem a ordem das linhas, depois a do cabeçalho. */
    async function selecionar(...ids: number[]) {
      const caixas = await loader.getAllHarnesses(MatCheckboxHarness);
      for (const id of ids) {
        await caixas[LOTES.findIndex((item) => item.id === id) + 1].check();
      }
    }

    async function acionar(texto: string) {
      const botao = [...fixture.nativeElement.querySelectorAll('.barra-acoes button')].find(
        (item: HTMLButtonElement) => item.textContent?.trim() === texto,
      ) as HTMLButtonElement;
      botao.click();
      await fixture.whenStable();
    }

    const mensagem = async () => (await raiz().getHarness(MatSnackBarHarness)).getMessage();
    const marcadas = async () => {
      const caixas = await loader.getAllHarnesses(MatCheckboxHarness);
      return (await Promise.all(caixas.map((caixa) => caixa.isChecked()))).filter(Boolean).length;
    };

    it('CL-19, CL-22: Enviar envia os selecionados, avisa, refaz a pesquisa e limpa a seleção', async () => {
      await criar({ lotes: LOTES });
      await selecionar(1, 2);

      await acionar('Enviar');

      expect(enviar).toHaveBeenCalledWith([1, 2]);
      expect(await mensagem()).toBe('2 lotes enviados.');
      expect(pesquisar).toHaveBeenCalledTimes(2);
      expect(await marcadas()).toBe(0);
    });

    it('CL-20: Confirmar confirma o lote enviado', async () => {
      await criar({ lotes: LOTES });
      await selecionar(3);

      await acionar('Confirmar');

      expect(confirmar).toHaveBeenCalledWith([3]);
      expect(await mensagem()).toBe('Lote 3 confirmado.');
    });

    it('CL-17: Excluir pede confirmação; cancelar não exclui', async () => {
      await criar({ lotes: LOTES });
      await selecionar(1);

      await acionar('Excluir');
      const dialogo = await raiz().getHarness(MatDialogHarness);
      expect(await dialogo.getContentText()).toContain('Excluir o lote 1?');
      await (await dialogo.getHarness(MatButtonHarness.with({ text: 'Cancelar' }))).click();

      expect(excluir).not.toHaveBeenCalled();
    });

    it('CL-17, CL-22: Excluir confirmado remove o lote e avisa', async () => {
      await criar({ lotes: LOTES });
      await selecionar(1);

      await acionar('Excluir');
      const dialogo = await raiz().getHarness(MatDialogHarness);
      await (await dialogo.getHarness(MatButtonHarness.with({ text: 'Excluir' }))).click();
      await fixture.whenStable();

      expect(excluir).toHaveBeenCalledWith(1);
      expect(await mensagem()).toBe('Lote 1 excluído.');
    });

    it('CL-21: Visualizar Justificativa mostra o texto num diálogo', async () => {
      await criar({ lotes: LOTES });
      await selecionar(4);

      await acionar('Visualizar Justificativa');

      const dialogo = await raiz().getHarness(MatDialogHarness);
      expect(await dialogo.getTitleText()).toBe('Justificativa do lote 4');
      expect(await dialogo.getContentText()).toContain('Reenviar o comprovante.');
    });

    it('CL-22: se a ação esvazia a página atual, volta para a anterior', async () => {
      await criar({
        pesquisar: (_filtros, numero) =>
          of(
            numero === 1
              ? pagina(lotesDe(1, 10), 11)
              : { ...pagina([criarLote({ id: 11 })], 11), pagina: 2 },
          ),
      });
      (
        fixture.nativeElement.querySelector('button[aria-label="Página 2"]') as HTMLButtonElement
      ).click();
      await fixture.whenStable();
      const [, unico] = await loader.getAllHarnesses(MatCheckboxHarness);
      await unico.check();

      await acionar('Excluir');
      const dialogo = await raiz().getHarness(MatDialogHarness);
      await (await dialogo.getHarness(MatButtonHarness.with({ text: 'Excluir' }))).click();
      await fixture.whenStable();

      expect(excluir).toHaveBeenCalledWith(11);
      expect(pesquisar).toHaveBeenLastCalledWith(FILTROS_PADRAO, 1, 10);
    });

    it('se a ação falhar, avisa e mantém a seleção para tentar de novo', async () => {
      await criar({ lotes: LOTES, enviar: () => throwError(() => new Error('falha')) });
      await selecionar(1);

      await acionar('Enviar');

      expect(await mensagem()).toBe('Não foi possível enviar os lotes.');
      expect(await marcadas()).toBe(1);
    });
  });
});
