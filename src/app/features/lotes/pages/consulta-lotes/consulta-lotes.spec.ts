import '@angular/common/locales/global/pt';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { Observable, of, Subject, throwError } from 'rxjs';
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

  async function criar(
    opcoes: {
      instituicoes?: Observable<readonly Instituicao[]>;
      lotes?: readonly Lote[];
      total?: number;
      pesquisar?: LotesApi['pesquisar'];
    } = {},
  ) {
    const cadastros: CadastrosApi = {
      listarInstituicoes: () => opcoes.instituicoes ?? of(INSTITUICOES),
    };
    pesquisar = vi.fn<LotesApi['pesquisar']>(
      opcoes.pesquisar ?? (() => of(pagina(opcoes.lotes ?? [], opcoes.total))),
    );
    TestBed.configureTestingModule({
      imports: [ConsultaLotes],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        provideDatasPtBr(),
        { provide: CadastrosApi, useValue: cadastros },
        { provide: LotesApi, useValue: { pesquisar } satisfies LotesApi },
      ],
    });
    fixture = TestBed.createComponent(ConsultaLotes);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
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
});
