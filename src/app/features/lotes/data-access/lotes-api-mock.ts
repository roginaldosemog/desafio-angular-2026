import { inject, Injectable, InjectionToken } from '@angular/core';
import { Router } from '@angular/router';
import { delay, map, Observable, of } from 'rxjs';
import { Pagina } from '../../../shared/models/pagina';
import { FiltrosLote } from '../models/filtros-lote';
import { Lote } from '../models/lote';
import { LotesApi } from './lotes-api';
import { filtrarLotes } from './mock/filtrar-lotes';
import { LOTES_MOCK } from './mock/lotes.mock';
import { paginar } from './mock/paginar';

/** Tempo de resposta simulado. Os testes o substituem para não depender de relógio. */
export const ATRASO_SIMULADO_MS = new InjectionToken<number>('ATRASO_SIMULADO_MS', {
  factory: () => 600,
});

/** Com `?simularErro=true` na URL, o servidor simulado responde com erro. */
export const PARAMETRO_SIMULAR_ERRO = 'simularErro';

/** Servidor simulado em memória. Só esta classe conhece os dados mock. */
@Injectable()
export class LotesApiMock implements LotesApi {
  private readonly router = inject(Router);
  private readonly atrasoMs = inject(ATRASO_SIMULADO_MS);
  private readonly lotes: readonly Lote[] = LOTES_MOCK;

  pesquisar(filtros: FiltrosLote, pagina: number, tamanhoPagina: number): Observable<Pagina<Lote>> {
    return this.responder(() => paginar(filtrarLotes(this.lotes, filtros), pagina, tamanhoPagina));
  }

  /**
   * Simula a ida ao servidor: espera o atraso e só então processa ou falha. A decisão é tomada
   * a cada inscrição, então tentar de novo (nova inscrição) reavalia a URL.
   */
  private responder<T>(processar: () => T): Observable<T> {
    return of(null).pipe(
      delay(this.atrasoMs),
      map(() => {
        if (this.falhaSimulada()) {
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
