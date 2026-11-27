import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CadastrosApi } from './cadastros-api';
import { CadastrosApiMock } from './cadastros-api-mock';
import { INSTITUICOES } from './mock/cadastros.mock';
import { ATRASO_SIMULADO_MS, ServidorSimulado } from './mock/servidor-simulado';

describe('CadastrosApiMock', () => {
  it('CL-04: lista as instituições', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ServidorSimulado,
        { provide: ATRASO_SIMULADO_MS, useValue: 0 },
        { provide: CadastrosApi, useClass: CadastrosApiMock },
      ],
    });

    const instituicoes = await firstValueFrom(TestBed.inject(CadastrosApi).listarInstituicoes());

    expect(instituicoes).toEqual(INSTITUICOES);
  });
});
