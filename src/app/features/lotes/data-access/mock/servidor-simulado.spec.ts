import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ATRASO_SIMULADO_MS, ServidorSimulado } from './servidor-simulado';

describe('ServidorSimulado', () => {
  function configurar(atrasoMs = 0): ServidorSimulado {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        ServidorSimulado,
        { provide: ATRASO_SIMULADO_MS, useValue: atrasoMs },
      ],
    });
    return TestBed.inject(ServidorSimulado);
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('CL-08: responde só depois do atraso simulado (of + delay)', () => {
    vi.useFakeTimers();
    const servidor = configurar(600);
    const respostas: string[] = [];

    servidor.responder(() => 'ok').subscribe((resposta) => respostas.push(resposta));

    vi.advanceTimersByTime(599);
    expect(respostas).toEqual([]);

    vi.advanceTimersByTime(1);
    expect(respostas).toEqual(['ok']);
  });

  it('processa no momento da resposta, não no momento da chamada', async () => {
    const servidor = configurar();
    let valor = 'antes';

    const resposta = firstValueFrom(servidor.responder(() => valor));
    valor = 'depois';

    await expect(resposta).resolves.toBe('depois');
  });

  it('CL-09: falha quando a URL tem ?simularErro=true', async () => {
    const servidor = configurar();
    await TestBed.inject(Router).navigateByUrl('/?simularErro=true');

    await expect(firstValueFrom(servidor.responder(() => 'ok'))).rejects.toThrow(/simulada/i);
  });

  it('CL-09: volta a responder quando o parâmetro sai da URL', async () => {
    const servidor = configurar();
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/?simularErro=true');
    await expect(firstValueFrom(servidor.responder(() => 'ok'))).rejects.toThrow();

    await router.navigateByUrl('/');

    await expect(firstValueFrom(servidor.responder(() => 'ok'))).resolves.toBe('ok');
  });
});
