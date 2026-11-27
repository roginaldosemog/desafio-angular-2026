import '@angular/common/locales/global/pt';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatRadioButtonHarness } from '@angular/material/radio/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { of } from 'rxjs';
import { Pagina } from '../../../../shared/models/pagina';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { Evento } from '../../models/cadastros';
import { PesquisaEvento } from './pesquisa-evento';

const EVENTOS: readonly Evento[] = [
  {
    id: 102,
    codigo: 300,
    descricao: 'Centralizacao Titulo CSC Credito',
    dataInicio: '2019-12-31',
    dataFim: null,
  },
  {
    id: 115,
    codigo: 410,
    descricao: 'Ajuste Saldo CSC',
    dataInicio: '2020-01-15',
    dataFim: '2025-12-31',
  },
];

describe('PesquisaEvento', () => {
  let fixture: ComponentFixture<PesquisaEvento>;
  let loader: HarnessLoader;
  let pesquisarEventos: ReturnType<typeof vi.fn<CadastrosApi['pesquisarEventos']>>;
  let fechar: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    pesquisarEventos = vi.fn<CadastrosApi['pesquisarEventos']>(
      (): ReturnType<CadastrosApi['pesquisarEventos']> =>
        of({
          itens: EVENTOS,
          total: EVENTOS.length,
          pagina: 1,
          tamanhoPagina: 5,
        } satisfies Pagina<Evento>),
    );
    fechar = vi.fn();
    const cadastros: CadastrosApi = {
      listarInstituicoes: () => of([]),
      buscarContaCorrente: () => of(null),
      listarHistoricos: () => of([]),
      listarPontosAtendimento: () => of([]),
      buscarEvento: () => of(null),
      pesquisarEventos,
    };
    TestBed.configureTestingModule({
      imports: [PesquisaEvento],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
        { provide: MatDialogRef, useValue: { close: fechar } },
        { provide: CadastrosApi, useValue: cadastros },
      ],
    });
    fixture = TestBed.createComponent(PesquisaEvento);
    loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();
  });

  const botao = (texto: string) => loader.getHarness(MatButtonHarness.with({ text: texto }));

  it('IL-08: ao abrir, lista os eventos na tabela', async () => {
    const tabela = await loader.getHarness(MatTableHarness);
    const [cabecalho] = await tabela.getHeaderRows();

    expect(await cabecalho.getCellTextByIndex()).toEqual([
      'Seleção',
      'ID Evento',
      'Cód. Evento',
      'Descrição',
      'Dt. Início',
      'Dt. Fim',
    ]);
    const [primeira] = await tabela.getCellTextByIndex();
    expect(primeira).toEqual([
      '',
      '102',
      '300',
      'Centralizacao Titulo CSC Credito',
      '31/12/2019',
      '',
    ]);
  });

  it('IL-08: Listar pesquisa pelo campo e pelo valor informados', async () => {
    const campo = await loader.getHarness(MatSelectHarness.with({ selector: '.campo-busca' }));
    await campo.open();
    await campo.clickOptions({ text: 'Descrição' });
    await (
      await loader.getHarness(MatInputHarness.with({ selector: '.valor-busca' }))
    ).setValue('csc');

    await (await botao('Listar')).click();

    expect(pesquisarEventos).toHaveBeenLastCalledWith('descricao', 'csc', 1, 5);
  });

  it('IL-08: OK fica desabilitado até escolher um evento e devolve o escolhido', async () => {
    expect(await (await botao('OK')).isDisabled()).toBe(true);

    const [primeiro] = await loader.getAllHarnesses(MatRadioButtonHarness);
    await primeiro.check();
    await (await botao('OK')).click();

    expect(fechar).toHaveBeenCalledWith(EVENTOS[0]);
  });

  it('DS-26: cada opção tem um nome acessível com a descrição do evento', async () => {
    // Como no checkbox, o aria-label do mat-radio-button fica no input interno.
    const primeiro: HTMLInputElement =
      fixture.nativeElement.querySelector('mat-radio-button input');

    expect(primeiro.getAttribute('aria-label')).toBe(
      'Selecionar evento 102 - Centralizacao Titulo CSC Credito',
    );
  });
});
