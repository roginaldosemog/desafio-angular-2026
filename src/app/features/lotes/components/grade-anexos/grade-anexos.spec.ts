import '@angular/common/locales/global/pt';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatRadioButtonHarness } from '@angular/material/radio/testing';
import { MatTableHarness } from '@angular/material/table/testing';
import { Anexo } from '../../models/lancamento';
import { GradeAnexos } from './grade-anexos';

const ANEXO: Anexo = {
  nomeArquivo: 'test-incluir2.pdf',
  descricao: 'test-incluir2.pdf',
  dataHoraInclusao: '2026-04-27T12:36:00',
  usuario: '',
};

describe('GradeAnexos', () => {
  let fixture: ComponentFixture<GradeAnexos>;

  async function criar(anexos: readonly Anexo[]) {
    TestBed.configureTestingModule({
      imports: [GradeAnexos],
      providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }],
    });
    fixture = TestBed.createComponent(GradeAnexos);
    fixture.componentRef.setInput('anexos', anexos);
    await fixture.whenStable();
    return TestbedHarnessEnvironment.loader(fixture);
  }

  it('IL-10: mostra as colunas e os dados do anexo, como na referência', async () => {
    const tabela = await (await criar([ANEXO])).getHarness(MatTableHarness);
    const [cabecalho] = await tabela.getHeaderRows();

    expect(await cabecalho.getCellTextByIndex()).toEqual([
      'Seleção',
      'Nome Reduzido do Arquivo',
      'Descrição',
      'Data Inclusão',
      'ID Usuário',
    ]);
    expect((await tabela.getCellTextByIndex())[0]).toEqual([
      '',
      'test-incluir2.pdf',
      'test-incluir2.pdf',
      '27/04/2026 12:36',
      '',
    ]);
  });

  it('IL-10: sem anexos, mostra "Nenhum registro encontrado."', async () => {
    await criar([]);

    expect(fixture.nativeElement.textContent).toContain('Nenhum registro encontrado.');
  });

  it('IL-10: escolher um anexo informa a posição dele', async () => {
    const loader = await criar([ANEXO, { ...ANEXO, nomeArquivo: 'outro.pdf' }]);
    const [, segundo] = await loader.getAllHarnesses(MatRadioButtonHarness);

    await segundo.check();

    expect(fixture.componentInstance.selecionado()).toBe(1);
  });
});
