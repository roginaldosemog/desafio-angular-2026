import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { FILTROS_PADRAO, FiltrosLotes } from '../../components/filtros-lotes/filtros-lotes';
import { TabelaLotes } from '../../components/tabela-lotes/tabela-lotes';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { LotesApi } from '../../data-access/lotes-api';
import { FiltrosLote } from '../../models/filtros-lote';

/** CL-13: 10 lotes por página. */
const TAMANHO_PAGINA = 10;

/** Página da consulta (container): guarda o estado e o repassa aos componentes. */
@Component({
  selector: 'app-consulta-lotes',
  imports: [FiltrosLotes, TabelaLotes],
  templateUrl: './consulta-lotes.html',
  styleUrl: './consulta-lotes.scss',
})
export class ConsultaLotes {
  private readonly cadastros = inject(CadastrosApi);
  private readonly lotesApi = inject(LotesApi);

  /** Se a lista falhar, os filtros continuam utilizáveis com os valores padrão. */
  protected readonly instituicoes = toSignal(
    this.cadastros.listarInstituicoes().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  /** O que pesquisar. Ao abrir, os filtros padrão na primeira página (CL-06). */
  private readonly consulta = signal({ filtros: FILTROS_PADRAO, pagina: 1 });

  /**
   * Refaz a pesquisa sempre que a consulta muda e descarta a resposta anterior ainda pendente.
   * Também expõe carregamento, erro e `reload()`, usados nos próximos passos.
   */
  private readonly resultado = rxResource({
    params: () => this.consulta(),
    stream: ({ params }) => this.lotesApi.pesquisar(params.filtros, params.pagina, TAMANHO_PAGINA),
  });

  protected readonly lotes = computed(() =>
    this.resultado.hasValue() ? this.resultado.value().itens : [],
  );

  protected readonly selecionados = signal<ReadonlySet<number>>(new Set());

  protected aoPesquisar(filtros: FiltrosLote): void {
    this.consulta.set({ filtros, pagina: 1 });
    this.selecionados.set(new Set());
  }
}
