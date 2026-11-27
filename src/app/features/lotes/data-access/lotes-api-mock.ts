import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagina } from '../../../shared/models/pagina';
import { FiltrosLote } from '../models/filtros-lote';
import { Lote, SituacaoLote } from '../models/lote';
import { LotesApi } from './lotes-api';
import { BancoEmMemoria } from './mock/banco-em-memoria';
import { USUARIO_LOGADO } from './mock/cadastros.mock';
import { filtrarLotes } from './mock/filtrar-lotes';
import { paginar } from './mock/paginar';
import { ServidorSimulado } from './mock/servidor-simulado';

/**
 * Lotes no banco em memória. Só as classes `*Mock` conhecem os dados mock. As regras de situação
 * são validadas aqui, como um servidor faria: a tela não é a única barreira.
 */
@Injectable()
export class LotesApiMock implements LotesApi {
  private readonly servidor = inject(ServidorSimulado);
  private readonly banco = inject(BancoEmMemoria);

  pesquisar(filtros: FiltrosLote, pagina: number, tamanhoPagina: number): Observable<Pagina<Lote>> {
    return this.servidor.responder(() =>
      paginar(filtrarLotes(this.banco.lotes, filtros), pagina, tamanhoPagina),
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
      this.banco.lotes = this.banco.lotes.filter((lote) => lote.id !== id);
      this.banco.lancamentos = this.banco.lancamentos.filter((item) => item.loteId !== id);
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
    this.banco.lotes = this.banco.lotes.map((lote) =>
      ids.includes(lote.id) ? { ...lote, ...alteracoes, situacao: para, dataHoraSituacao } : lote,
    );
  }

  /** Tudo ou nada: se um lote estiver fora da situação, nenhum é alterado. */
  private exigirSituacao(ids: readonly number[], situacao: SituacaoLote): void {
    const fora = ids.filter(
      (id) => this.banco.lotes.find((lote) => lote.id === id)?.situacao !== situacao,
    );
    if (fora.length > 0) {
      throw new Error(`Lotes que não estão na situação ${situacao}: ${fora.join(', ')}.`);
    }
  }
}
