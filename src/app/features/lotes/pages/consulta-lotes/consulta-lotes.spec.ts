import '@angular/common/locales/global/pt';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatCheckboxHarness } from '@angular/material/checkbox/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { Observable, of, throwError } from 'rxjs';
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

function pagina(itens: readonly Lote[]): Pagina<Lote> {
  return { itens, total: itens.length, pagina: 1, tamanhoPagina: 10 };
}

describe('ConsultaLotes', () => {
  let loader: HarnessLoader;
  let pesquisar: ReturnType<typeof vi.fn<LotesApi['pesquisar']>>;

  async function criar(
    opcoes: {
      instituicoes?: Observable<readonly Instituicao[]>;
      lotes?: readonly Lote[];
    } = {},
  ) {
    const cadastros: CadastrosApi = {
      listarInstituicoes: () => opcoes.instituicoes ?? of(INSTITUICOES),
    };
    pesquisar = vi.fn<LotesApi['pesquisar']>(() => of(pagina(opcoes.lotes ?? [])));
    TestBed.configureTestingModule({
      imports: [ConsultaLotes],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        provideDatasPtBr(),
        { provide: CadastrosApi, useValue: cadastros },
        { provide: LotesApi, useValue: { pesquisar } satisfies LotesApi },
      ],
    });
    const fixture = TestBed.createComponent(ConsultaLotes);
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
});
