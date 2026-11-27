import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CadastrosApi } from './cadastros-api';
import { CadastrosApiMock } from './cadastros-api-mock';
import { HISTORICOS, INSTITUICOES, PONTOS_ATENDIMENTO } from './mock/cadastros.mock';
import { ATRASO_SIMULADO_MS, ServidorSimulado } from './mock/servidor-simulado';

describe('CadastrosApiMock', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ServidorSimulado,
        { provide: ATRASO_SIMULADO_MS, useValue: 0 },
        { provide: CadastrosApi, useClass: CadastrosApiMock },
      ],
    });
  });

  it('CL-04: lista as instituições', async () => {
    const instituicoes = await firstValueFrom(TestBed.inject(CadastrosApi).listarInstituicoes());

    expect(instituicoes).toEqual(INSTITUICOES);
  });

  it('CL-09: a falha simulada da pesquisa não afeta a lista de instituições', async () => {
    await TestBed.inject(Router).navigateByUrl('/?simularErro=true');

    const instituicoes = await firstValueFrom(TestBed.inject(CadastrosApi).listarInstituicoes());

    expect(instituicoes).toEqual(INSTITUICOES);
  });

  it('IL-03: busca a conta corrente pelo número, com o titular', async () => {
    const api = TestBed.inject(CadastrosApi);

    expect(await firstValueFrom(api.buscarContaCorrente('44444'))).toEqual({
      numero: '44444',
      titular: 'Ana Paula Costa',
    });
    expect(await firstValueFrom(api.buscarContaCorrente('99999'))).toBeNull();
  });

  it('IL-05: lista os históricos', async () => {
    expect(await firstValueFrom(TestBed.inject(CadastrosApi).listarHistoricos())).toEqual(
      HISTORICOS,
    );
  });

  it('IL-07: lista os PAs', async () => {
    expect(await firstValueFrom(TestBed.inject(CadastrosApi).listarPontosAtendimento())).toEqual(
      PONTOS_ATENDIMENTO,
    );
  });
});
