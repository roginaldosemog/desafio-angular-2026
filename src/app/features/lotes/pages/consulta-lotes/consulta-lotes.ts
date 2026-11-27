import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { FiltrosLotes } from '../../components/filtros-lotes/filtros-lotes';
import { CadastrosApi } from '../../data-access/cadastros-api';

/** Página da consulta (container): busca os dados e os repassa aos componentes. */
@Component({
  selector: 'app-consulta-lotes',
  imports: [FiltrosLotes],
  templateUrl: './consulta-lotes.html',
  styleUrl: './consulta-lotes.scss',
})
export class ConsultaLotes {
  private readonly cadastros = inject(CadastrosApi);

  /** Se a lista falhar, os filtros continuam utilizáveis com os valores padrão. */
  protected readonly instituicoes = toSignal(
    this.cadastros.listarInstituicoes().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );
}
