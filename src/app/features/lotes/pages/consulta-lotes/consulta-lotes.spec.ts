import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatInputHarness } from '@angular/material/input/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { Observable, of, throwError } from 'rxjs';
import { provideDatasPtBr } from '../../../../shared/datas/datas-pt-br';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { Instituicao } from '../../models/cadastros';
import { ConsultaLotes } from './consulta-lotes';

describe('ConsultaLotes', () => {
  async function criar(instituicoes: Observable<readonly Instituicao[]>) {
    const cadastros: CadastrosApi = { listarInstituicoes: () => instituicoes };
    TestBed.configureTestingModule({
      imports: [ConsultaLotes],
      providers: [
        { provide: LOCALE_ID, useValue: 'pt-BR' },
        provideDatasPtBr(),
        { provide: CadastrosApi, useValue: cadastros },
      ],
    });
    const fixture = TestBed.createComponent(ConsultaLotes);
    await fixture.whenStable();
    return TestbedHarnessEnvironment.loader(fixture);
  }

  it('CL-04: mostra os filtros com as instituições do serviço de cadastros', async () => {
    const loader = await criar(
      of([
        { codigo: '0001', nome: 'SICOOB' },
        { codigo: '0002', nome: 'SICOOB CENTRAL' },
      ]),
    );

    const instituicao = await loader.getHarness(
      MatSelectHarness.with({ selector: '.instituicao' }),
    );

    expect(await instituicao.getValueText()).toBe('0002 - SICOOB CENTRAL');
  });

  it('mantém os filtros utilizáveis se a lista de instituições falhar', async () => {
    const loader = await criar(throwError(() => new Error('falha')));

    const responsavel = await loader.getHarness(
      MatInputHarness.with({ selector: '.instituicao-responsavel' }),
    );

    expect(await responsavel.getValue()).toBe('0001');
  });
});
