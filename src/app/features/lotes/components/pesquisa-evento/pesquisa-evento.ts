import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Paginacao } from '../../../../shared/components/paginacao/paginacao';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { CampoBuscaEvento } from '../../models/cadastros';

const TAMANHO_PAGINA = 5;

const CAMPOS_BUSCA: readonly { valor: CampoBuscaEvento; rotulo: string }[] = [
  { valor: 'id', rotulo: 'ID Evento' },
  { valor: 'codigo', rotulo: 'Cód. Evento' },
  { valor: 'descricao', rotulo: 'Descrição' },
];

/**
 * Modal "Pesquisa Evento" (IL-08, DS-23). Fecha com o evento escolhido no OK, ou sem resultado
 * no Fechar. A escolha é única, por isso radio, e não caixa de seleção.
 */
@Component({
  selector: 'app-pesquisa-evento',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatSelectModule,
    MatTableModule,
    Paginacao,
  ],
  templateUrl: './pesquisa-evento.html',
  styleUrl: './pesquisa-evento.scss',
})
export class PesquisaEvento {
  private readonly cadastros = inject(CadastrosApi);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly camposBusca = CAMPOS_BUSCA;
  protected readonly tamanhoPagina = TAMANHO_PAGINA;
  protected readonly colunas = ['selecao', 'id', 'codigo', 'descricao', 'dataInicio', 'dataFim'];

  protected readonly form = this.fb.group({
    campo: this.fb.control<CampoBuscaEvento>('id'),
    valor: [''],
  });

  /** A busca em andamento. Ao abrir, sem valor: lista todos os eventos. */
  private readonly busca = signal({ campo: 'id' as CampoBuscaEvento, valor: '', pagina: 1 });

  private readonly resultado = rxResource({
    params: () => this.busca(),
    stream: ({ params }) =>
      this.cadastros.pesquisarEventos(params.campo, params.valor, params.pagina, TAMANHO_PAGINA),
  });

  protected readonly eventos = computed(() =>
    this.resultado.hasValue() ? this.resultado.value().itens : [],
  );
  protected readonly total = computed(() =>
    this.resultado.hasValue() ? this.resultado.value().total : 0,
  );
  protected readonly pagina = computed(() => this.busca().pagina);

  protected readonly selecionadoId = signal<number | null>(null);
  protected readonly selecionado = computed(
    () => this.eventos().find((evento) => evento.id === this.selecionadoId()) ?? null,
  );

  protected listar(): void {
    this.busca.set({ ...this.form.getRawValue(), pagina: 1 });
    this.selecionadoId.set(null);
  }

  protected trocarPagina(pagina: number): void {
    this.busca.update((busca) => ({ ...busca, pagina }));
    this.selecionadoId.set(null);
  }
}
