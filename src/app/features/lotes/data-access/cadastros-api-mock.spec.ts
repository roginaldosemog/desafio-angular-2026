import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CadastrosApi } from './cadastros-api';
import { CadastrosApiMock } from './cadastros-api-mock';
import { INSTITUICOES } from './mock/cadastros.mock';
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
});
