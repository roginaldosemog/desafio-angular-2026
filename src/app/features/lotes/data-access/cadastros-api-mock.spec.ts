import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { CadastrosApi } from './cadastros-api';
import { CadastrosApiMock } from './cadastros-api-mock';
import { CampoBuscaEvento } from '../models/cadastros';
import { EVENTOS, HISTORICOS, INSTITUICOES, PONTOS_ATENDIMENTO } from './mock/cadastros.mock';
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

  describe('eventos', () => {
    const pesquisar = (campo: CampoBuscaEvento, valor: string, pagina = 1, tamanho = 10) =>
      firstValueFrom(TestBed.inject(CadastrosApi).pesquisarEventos(campo, valor, pagina, tamanho));
    const ids = (eventos: readonly { id: number }[]) => eventos.map((evento) => evento.id);

    it('IL-08: busca o evento pelo ID', async () => {
      const api = TestBed.inject(CadastrosApi);

      expect((await firstValueFrom(api.buscarEvento(102)))?.descricao).toBe(
        'Centralizacao Titulo CSC Credito',
      );
      expect(await firstValueFrom(api.buscarEvento(999))).toBeNull();
    });

    it('IL-08: sem valor, lista todos os eventos', async () => {
      expect((await pesquisar('descricao', '')).total).toBe(EVENTOS.length);
    });

    it('IL-08: pesquisa por ID e por código, pelo valor exato', async () => {
      expect(ids((await pesquisar('id', '102')).itens)).toEqual([102]);
      expect(ids((await pesquisar('codigo', '300')).itens)).toEqual([102]);
    });

    it('IL-08: pesquisa por descrição, por trecho, sem diferenciar maiúsculas', async () => {
      expect(ids((await pesquisar('descricao', 'csc credito')).itens)).toEqual([102]);
    });

    it('IL-08: pagina o resultado', async () => {
      const pagina = await pesquisar('descricao', '', 2, 2);

      expect(pagina.itens).toHaveLength(2);
      expect(pagina.total).toBe(EVENTOS.length);
    });
  });
});
