import { Injectable } from '@angular/core';
import { Lancamento } from '../../models/lancamento';
import { Lote } from '../../models/lote';
import { LANCAMENTOS_MOCK, LOTES_MOCK } from './lotes.mock';

/**
 * Os dados do "servidor" simulado, compartilhados pelas APIs mock: lotes e lançamentos ficam
 * consistentes entre si, como num banco de dados. Cada alteração troca a lista por uma nova.
 */
@Injectable()
export class BancoEmMemoria {
  lotes: readonly Lote[] = LOTES_MOCK;
  lancamentos: readonly Lancamento[] = LANCAMENTOS_MOCK;

  /** Sequências, como num banco: um ID excluído não é reaproveitado. */
  private ultimoIdLote = Math.max(...LOTES_MOCK.map((lote) => lote.id));
  private ultimoIdLancamento = Math.max(...LANCAMENTOS_MOCK.map((lancamento) => lancamento.id));

  novoIdLote(): number {
    return ++this.ultimoIdLote;
  }

  novoIdLancamento(): number {
    return ++this.ultimoIdLancamento;
  }

  /** Recalcula valor e quantidade do lote a partir dos lançamentos: uma única fonte da verdade. */
  atualizarResumo(loteId: number): void {
    const doLote = this.lancamentos.filter((lancamento) => lancamento.loteId === loteId);
    this.lotes = this.lotes.map((lote) =>
      lote.id === loteId
        ? {
            ...lote,
            valorCentavos: doLote.reduce((total, item) => total + item.valorCentavos, 0),
            quantidadeLancamentos: doLote.length,
          }
        : lote,
    );
  }
}
