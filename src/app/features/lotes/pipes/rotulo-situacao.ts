import { Pipe, PipeTransform } from '@angular/core';
import { ROTULO_SITUACAO_LOTE, SituacaoLote } from '../models/lote';

/**
 * Código da situação → texto da tela ("ABERTO" → "Aberto"). Como pipe, o parâmetro é tipado:
 * nas células do mat-table a linha chega como `any`, e indexar o `Record` direto no template
 * não compila com `strictTemplates`.
 */
@Pipe({ name: 'rotuloSituacao' })
export class RotuloSituacaoPipe implements PipeTransform {
  transform(situacao: SituacaoLote): string {
    return ROTULO_SITUACAO_LOTE[situacao];
  }
}
