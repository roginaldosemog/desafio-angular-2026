import { Component, computed, input, output } from '@angular/core';
import { Lote } from '../../models/lote';
import { AcaoLote, acoesHabilitadas } from '../../regras/acoes-lote';

/** Ordem da imagem de referência. */
const BOTOES: readonly { acao: AcaoLote; rotulo: string }[] = [
  { acao: 'confirmar', rotulo: 'Confirmar' },
  { acao: 'enviar', rotulo: 'Enviar' },
  { acao: 'justificativa', rotulo: 'Visualizar Justificativa' },
  { acao: 'incluir', rotulo: 'Incluir' },
  { acao: 'alterar', rotulo: 'Alterar' },
  { acao: 'excluir', rotulo: 'Excluir' },
  { acao: 'visualizar', rotulo: 'Visualizar' },
];

/**
 * Barra de ações dos lotes (DS-13). Só decide o que fica habilitado, pela regra pura
 * `acoesHabilitadas`, e avisa qual ação foi pedida; quem executa é a página.
 */
@Component({
  selector: 'app-barra-acoes',
  templateUrl: './barra-acoes.html',
  styleUrl: './barra-acoes.scss',
})
export class BarraAcoes {
  readonly selecionados = input.required<readonly Lote[]>();
  /** Enquanto uma ação está em andamento, tudo fica desabilitado: evita pedido repetido. */
  readonly ocupada = input(false);
  readonly acao = output<AcaoLote>();

  protected readonly botoes = BOTOES;
  protected readonly habilitadas = computed(() => acoesHabilitadas(this.selecionados()));
}
