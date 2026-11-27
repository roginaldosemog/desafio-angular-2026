import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { LotesApi } from './features/lotes/data-access/lotes-api';
import { LotesApiMock } from './features/lotes/data-access/lotes-api-mock';
import { ConsultaLotes } from './features/lotes/pages/consulta-lotes/consulta-lotes';

describe('Rotas da aplicação', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it('CL-01: redireciona a raiz para /contabil', async () => {
    await harness.navigateByUrl('/');

    expect(router.url).toBe('/contabil');
  });

  it('CL-01: carrega a consulta de lotes em /contabil', async () => {
    await harness.navigateByUrl('/contabil');

    expect(harness.routeDebugElement?.componentInstance).toBeInstanceOf(ConsultaLotes);
  });

  it('CL-01: define o título da aba', async () => {
    await harness.navigateByUrl('/contabil');

    expect(TestBed.inject(Title).getTitle()).toBe('Consulta de Lotes · Outros Créditos/Débitos');
  });

  it('CL-01: redireciona endereços desconhecidos para /contabil', async () => {
    await harness.navigateByUrl('/rota-inexistente');

    expect(router.url).toBe('/contabil');
  });

  it('CL-06: fornece a API de lotes simulada para a tela de consulta', async () => {
    await harness.navigateByUrl('/contabil');

    const api = harness.routeDebugElement?.injector.get(LotesApi);

    expect(api).toBeInstanceOf(LotesApiMock);
  });
});
