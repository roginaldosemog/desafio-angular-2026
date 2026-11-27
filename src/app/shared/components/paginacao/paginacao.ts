import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Quantidade máxima de números de página visíveis de uma vez. */
const JANELA = 5;

/**
 * Paginação com número de página (CL-13): primeira, anterior, números, próxima e última.
 * Existe porque o MatPaginator do Material não mostra os números das páginas.
 * Não guarda estado: recebe a página atual e avisa qual página o usuário pediu.
 */
@Component({
  selector: 'app-paginacao',
  imports: [MatIconModule],
  templateUrl: './paginacao.html',
  styleUrl: './paginacao.scss',
})
export class Paginacao {
  /** Página atual, começando em 1. */
  readonly pagina = input.required<number>();
  readonly total = input.required<number>();
  readonly tamanhoPagina = input.required<number>();
  readonly trocarPagina = output<number>();

  protected readonly totalPaginas = computed(() => Math.ceil(this.total() / this.tamanhoPagina()));

  /** Até 5 números, centralizados na página atual sem passar da primeira nem da última. */
  protected readonly numeros = computed(() => {
    const totalPaginas = this.totalPaginas();
    const quantidade = Math.min(JANELA, totalPaginas);
    const centralizada = Math.max(1, this.pagina() - Math.floor(JANELA / 2));
    const inicio = Math.min(centralizada, totalPaginas - quantidade + 1);
    return Array.from({ length: quantidade }, (_, indice) => inicio + indice);
  });

  protected ir(numero: number): void {
    if (numero !== this.pagina()) {
      this.trocarPagina.emit(numero);
    }
  }
}
