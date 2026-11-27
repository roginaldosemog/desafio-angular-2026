import { inject, Injectable, InjectionToken } from '@angular/core';
import { Router } from '@angular/router';
import { delay, map, Observable, of } from 'rxjs';

/** Tempo de resposta simulado. Os testes o substituem para não depender de relógio. */
export const ATRASO_SIMULADO_MS = new InjectionToken<number>('ATRASO_SIMULADO_MS', {
  factory: () => 600,
});

/** Com `?simularErro=true` na URL, o servidor simulado responde com erro. */
export const PARAMETRO_SIMULAR_ERRO = 'simularErro';

/** Comportamento comum das APIs simuladas: atraso de rede e falha sob demanda. */
@Injectable()
export class ServidorSimulado {
  private readonly router = inject(Router);
  private readonly atrasoMs = inject(ATRASO_SIMULADO_MS);

  /**
   * Espera o atraso e só então processa ou falha, como um servidor. A decisão é tomada a cada
   * inscrição, então tentar de novo (nova inscrição) reavalia a URL. Com `podeFalhar: false`
   * (listas de apoio), a falha simulada não se aplica: ela demonstra o erro da pesquisa (CL-09).
   */
  responder<T>(processar: () => T, { podeFalhar = true } = {}): Observable<T> {
    return of(null).pipe(
      delay(this.atrasoMs),
      map(() => {
        if (podeFalhar && this.falhaSimulada()) {
          throw new Error(`Falha simulada pela URL (?${PARAMETRO_SIMULAR_ERRO}=true).`);
        }
        return processar();
      }),
    );
  }

  private falhaSimulada(): boolean {
    const parametros = this.router.routerState.snapshot.root.queryParamMap;
    return parametros.get(PARAMETRO_SIMULAR_ERRO) === 'true';
  }
}
