import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';

export interface DadosDialogoMensagem {
  readonly titulo: string;
  readonly mensagem: string;
  /** Texto do botão de confirmação. Sem ele, o diálogo só informa e tem o botão Fechar. */
  readonly confirmar?: string;
}

/**
 * Diálogo simples de mensagem ou confirmação. Fecha com `true` ao confirmar. O MatDialog cuida
 * do foco preso no diálogo, do Esc e de devolver o foco ao botão que o abriu.
 */
@Component({
  selector: 'app-dialogo-mensagem',
  imports: [MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ dados.titulo }}</h2>
    <mat-dialog-content>{{ dados.mensagem }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (dados.confirmar) {
        <button matButton="outlined" type="button" [mat-dialog-close]="false">Cancelar</button>
        <button matButton="filled" type="button" [mat-dialog-close]="true">
          {{ dados.confirmar }}
        </button>
      } @else {
        <button matButton="filled" type="button" mat-dialog-close>Fechar</button>
      }
    </mat-dialog-actions>
  `,
})
export class DialogoMensagem {
  protected readonly dados = inject<DadosDialogoMensagem>(MAT_DIALOG_DATA);
}
