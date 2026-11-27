import { DatePipe } from '@angular/common';
import { Component, input, model } from '@angular/core';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { Anexo } from '../../models/lancamento';

/**
 * Grade de anexos do lançamento (IL-10). Escolha única (radio): Visualizar e Excluir trabalham
 * sobre um anexo. Os anexos ainda não gravados não têm ID, então a escolha é pela posição.
 */
@Component({
  selector: 'app-grade-anexos',
  imports: [DatePipe, MatRadioModule, MatTableModule],
  templateUrl: './grade-anexos.html',
  styleUrl: './grade-anexos.scss',
})
export class GradeAnexos {
  readonly anexos = input.required<readonly Anexo[]>();
  /** Posição do anexo escolhido, ou `null`. */
  readonly selecionado = model<number | null>(null);

  protected readonly colunas = [
    'selecao',
    'nomeArquivo',
    'descricao',
    'dataHoraInclusao',
    'usuario',
  ];
}
