import { DatePipe } from '@angular/common';
import { Component, computed, input, model } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { ReaisPipe } from '../../../../shared/pipes/reais';
import { Lote } from '../../models/lote';
import { RotuloSituacaoPipe } from '../../pipes/rotulo-situacao';

/**
 * Tabela de lotes com seleção (CL-10 a CL-12). A seleção é um `model()`: a página a lê e a
 * altera (ex.: limpa ao pesquisar), e a tabela a atualiza quando o usuário marca uma caixa.
 */
@Component({
  selector: 'app-tabela-lotes',
  imports: [DatePipe, MatCheckboxModule, MatTableModule, ReaisPipe, RotuloSituacaoPipe],
  templateUrl: './tabela-lotes.html',
  styleUrl: './tabela-lotes.scss',
})
export class TabelaLotes {
  readonly lotes = input.required<readonly Lote[]>();
  readonly selecionados = model<ReadonlySet<number>>(new Set());

  protected readonly colunas = [
    'selecao',
    'id',
    'dataEntrada',
    'valor',
    'quantidade',
    'usuarioRegistro',
    'usuarioAprovacao',
    'situacao',
    'dataHoraSituacao',
  ];

  protected readonly todosSelecionados = computed(() => {
    const lotes = this.lotes();
    return lotes.length > 0 && lotes.every((lote) => this.selecionados().has(lote.id));
  });

  protected readonly selecaoParcial = computed(
    () =>
      !this.todosSelecionados() && this.lotes().some((lote) => this.selecionados().has(lote.id)),
  );

  protected alternar(id: number): void {
    const selecao = new Set(this.selecionados());
    if (!selecao.delete(id)) {
      selecao.add(id);
    }
    this.selecionados.set(selecao);
  }

  /** Com todos marcados, desmarca todos; senão, marca todos os lotes da página. */
  protected alternarTodos(): void {
    const ids = this.todosSelecionados() ? [] : this.lotes().map((lote) => lote.id);
    this.selecionados.set(new Set(ids));
  }
}
