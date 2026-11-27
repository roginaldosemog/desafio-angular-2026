import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { App } from './app';
import { appConfig } from './app.config';

describe('App', () => {
  let elemento: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appConfig.providers,
    }).compileComponents();

    const fixture = TestBed.createComponent(App);
    await TestBed.inject(Router).navigateByUrl('/contabil');
    await fixture.whenStable();
    elemento = fixture.nativeElement as HTMLElement;
  });

  it('CL-02: exibe o título do módulo', () => {
    expect(elemento.querySelector('h1')?.textContent).toBe('Outros Créditos/Débitos');
  });

  it('CL-02: exibe o breadcrumb Início > Outros Créditos/Débitos', () => {
    const breadcrumb = elemento.querySelector('nav[aria-label="Navegação estrutural"]');
    const inicio = breadcrumb?.querySelector('a');

    expect(inicio?.textContent).toBe('Início');
    expect(inicio?.getAttribute('href')).toBe('/');
    expect(breadcrumb?.querySelector('[aria-current="page"]')?.textContent).toBe(
      'Outros Créditos/Débitos',
    );
  });

  it('CL-02: marca o módulo Contábil como página atual', () => {
    const modulo = elemento.querySelector<HTMLAnchorElement>('nav[aria-label="Módulos"] a');

    expect(modulo?.getAttribute('href')).toBe('/contabil');
    expect(modulo?.textContent).toContain('Contábil');
    expect(modulo?.getAttribute('aria-current')).toBe('page');
    expect(modulo?.classList).toContain('ativo');
  });

  it('CL-02: exibe o ícone do módulo oculto para leitores de tela', () => {
    const icone = elemento.querySelector('nav[aria-label="Módulos"] mat-icon');

    expect(icone?.textContent?.trim()).toBe('table_view');
    expect(icone?.classList).toContain('material-symbols-outlined');
    expect(icone?.getAttribute('aria-hidden')).toBe('true');
  });
});
