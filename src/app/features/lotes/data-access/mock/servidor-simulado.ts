import { inject, Injectable, InjectionToken } from '@angular/core';
import { Router } from '@angular/router';
import { delay, map, Observable, of } from 'rxjs';
import { paraDataHoraIso } from '../../../../shared/datas/datas-pt-br';
import { DataHoraIso } from '../../../../shared/models/datas';

/** Tempo de resposta simulado. Os testes o substituem para não depender de relógio. */
export const ATRASO_SIMULADO_MS = new InjectionToken<number>('ATRASO_SIMULADO_MS', {
  factory: () => 600,
});

/** Hora do servidor simulado. Os testes a fixam para o resultado ser previsível. */
export const RELOGIO_SIMULADO = new InjectionToken<() => Date>('RELOGIO_SIMULADO', {
  factory: () => () => new Date(),
});

/** Com `?simularErro=true` na URL, o servidor simulado responde com erro. */
export const PARAMETRO_SIMULAR_ERRO = 'simularErro';

/** Comportamento comum das APIs simuladas: atraso de rede e falha sob demanda. */
@Injectable()
export class ServidorSimulado {
  private readonly router = inject(Router);
  private readonly atrasoMs = inject(ATRASO_SIMULADO_MS);
  private readonly relogio = inject(RELOGIO_SIMULADO);

  /** Data e hora atuais do servidor, no formato do modelo. */
  agora(): DataHoraIso {
    return paraDataHoraIso(this.relogio());
  }

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
