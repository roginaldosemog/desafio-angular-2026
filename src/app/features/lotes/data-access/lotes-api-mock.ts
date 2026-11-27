import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagina } from '../../../shared/models/pagina';
import { FiltrosLote } from '../models/filtros-lote';
import { Lote, SituacaoLote } from '../models/lote';
import { LotesApi } from './lotes-api';
import { USUARIO_LOGADO } from './mock/cadastros.mock';
import { filtrarLotes } from './mock/filtrar-lotes';
import { LOTES_MOCK } from './mock/lotes.mock';
import { paginar } from './mock/paginar';
import { ServidorSimulado } from './mock/servidor-simulado';

/**
 * Lotes em memória. Só as classes `*Mock` conhecem os dados mock. Cada alteração troca a lista
 * inteira por uma nova (imutabilidade), e as regras de situação são validadas aqui, como um
 * servidor faria: a tela não é a única barreira.
 */
@Injectable()
export class LotesApiMock implements LotesApi {
  private readonly servidor = inject(ServidorSimulado);
  private lotes: readonly Lote[] = LOTES_MOCK;

  pesquisar(filtros: FiltrosLote, pagina: number, tamanhoPagina: number): Observable<Pagina<Lote>> {
    return this.servidor.responder(() =>
      paginar(filtrarLotes(this.lotes, filtros), pagina, tamanhoPagina),
    );
  }

  enviar(ids: readonly number[]): Observable<void> {
    return this.servidor.responder(() => this.mudarSituacao(ids, 'ABERTO', 'ENVIADO'));
  }

  confirmar(ids: readonly number[]): Observable<void> {
    return this.servidor.responder(() =>
      this.mudarSituacao(ids, 'ENVIADO', 'CONFIRMADO', { usuarioAprovacao: USUARIO_LOGADO }),
    );
  }

  excluir(id: number): Observable<void> {
    return this.servidor.responder(() => {
      this.exigirSituacao([id], 'ABERTO');
      this.lotes = this.lotes.filter((lote) => lote.id !== id);
    });
  }

  private mudarSituacao(
    ids: readonly number[],
    de: SituacaoLote,
    para: SituacaoLote,
    alteracoes: Partial<Lote> = {},
  ): void {
    this.exigirSituacao(ids, de);
    const dataHoraSituacao = this.servidor.agora();
    this.lotes = this.lotes.map((lote) =>
      ids.includes(lote.id) ? { ...lote, ...alteracoes, situacao: para, dataHoraSituacao } : lote,
    );
  }

  /** Tudo ou nada: se um lote estiver fora da situação, nenhum é alterado. */
  private exigirSituacao(ids: readonly number[], situacao: SituacaoLote): void {
    const fora = ids.filter(
      (id) => this.lotes.find((lote) => lote.id === id)?.situacao !== situacao,
    );
    if (fora.length > 0) {
      throw new Error(`Lotes que não estão na situação ${situacao}: ${fora.join(', ')}.`);
    }
  }
}
