import { Component, computed, input } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { ReaisPipe } from '../../../../shared/pipes/reais';
import { Historico } from '../../models/cadastros';
import { Lancamento, ROTULO_SITUACAO_LANCAMENTO } from '../../models/lancamento';

/** Linha já pronta para exibir: os textos são resolvidos no TypeScript, com tipos. */
interface LinhaGrade {
  readonly id: number;
  readonly contaCorrente: string;
  readonly titular: string;
  readonly historico: string;
  readonly valorCentavos: number;
  readonly documento: string;
  readonly situacao: string;
}

/** Grade dos lançamentos do lote (IL-14), dentro do modal. */
@Component({
  selector: 'app-grade-lancamentos',
  imports: [MatTableModule, ReaisPipe],
  templateUrl: './grade-lancamentos.html',
  styleUrl: './grade-lancamentos.scss',
})
export class GradeLancamentos {
  readonly lancamentos = input.required<readonly Lancamento[]>();
  readonly historicos = input.required<readonly Historico[]>();

  protected readonly colunas = [
    'contaCorrente',
    'titular',
    'historico',
    'valor',
    'documento',
    'situacao',
  ];

  /**
   * Modelo de exibição: nas células do mat-table a linha chega como `any`. Montando as linhas
   * aqui, a tradução de códigos (histórico, situação) é verificada pelo compilador.
   */
  protected readonly linhas = computed<readonly LinhaGrade[]>(() => {
    const historicos = new Map(this.historicos().map((item) => [item.id, item.descricao]));
    return this.lancamentos().map((lancamento) => ({
      id: lancamento.id,
      contaCorrente: lancamento.contaCorrente,
      titular: lancamento.titular,
      historico: historicos.get(lancamento.historicoId) ?? String(lancamento.historicoId),
      valorCentavos: lancamento.valorCentavos,
      documento: lancamento.documento,
      situacao: ROTULO_SITUACAO_LANCAMENTO[lancamento.situacao],
    }));
  });
}
