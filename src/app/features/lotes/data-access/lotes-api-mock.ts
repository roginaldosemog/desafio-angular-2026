import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagina } from '../../../shared/models/pagina';
import { FiltrosLote } from '../models/filtros-lote';
import { Lote } from '../models/lote';
import { LotesApi } from './lotes-api';
import { filtrarLotes } from './mock/filtrar-lotes';
import { LOTES_MOCK } from './mock/lotes.mock';
import { paginar } from './mock/paginar';
import { ServidorSimulado } from './mock/servidor-simulado';

/** Lotes em memória. Só as classes `*Mock` conhecem os dados mock. */
@Injectable()
export class LotesApiMock implements LotesApi {
  private readonly servidor = inject(ServidorSimulado);
  private readonly lotes: readonly Lote[] = LOTES_MOCK;

  pesquisar(filtros: FiltrosLote, pagina: number, tamanhoPagina: number): Observable<Pagina<Lote>> {
    return this.servidor.responder(() =>
      paginar(filtrarLotes(this.lotes, filtros), pagina, tamanhoPagina),
    );
  }
}
