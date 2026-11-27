import { Component, computed, inject, InjectionToken, input } from '@angular/core';
import { outputFromObservable } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { debounceTime, filter, map, merge, share, Subject, tap } from 'rxjs';
import { paraDataIso } from '../../../../shared/datas/datas-pt-br';
import { CampoMonetario } from '../../../../shared/directives/campo-monetario';
import { MascaraData } from '../../../../shared/directives/mascara-data';
import { ErroNaFaixa, validarFaixa } from '../../../../shared/forms/faixa';
import { Instituicao } from '../../models/cadastros';
import { FiltrosLote } from '../../models/filtros-lote';
import { ROTULO_SITUACAO_LOTE, SITUACOES_LOTE, SituacaoLote } from '../../models/lote';

/** Valores iniciais da tela, como na imagem de referência (CL-04). */
export const FILTROS_PADRAO: FiltrosLote = {
  instituicaoResponsavel: '0001',
  instituicao: '0002',
  situacao: null,
  idLote: { de: null, ate: null },
  valorCentavos: { de: null, ate: null },
  dataEntrada: { de: null, ate: null },
};

/** Espera da pesquisa automática depois da última alteração (CL-07). Os testes a substituem. */
export const ATRASO_PESQUISA_AUTOMATICA_MS = new InjectionToken<number>(
  'ATRASO_PESQUISA_AUTOMATICA_MS',
  { factory: () => 400 },
);

const mesmosFiltros = (a: FiltrosLote, b: FiltrosLote) => JSON.stringify(a) === JSON.stringify(b);

/**
 * No mat-select, opção com valor `null` limpa a seleção e aparece vazia. Por isso "Todas" usa
 * um valor próprio na tela, convertido para `null` no modelo.
 */
const TODAS = 'TODAS';

/** Inteiro a partir de 1, sem zeros à esquerda. */
const INTEIRO_POSITIVO = /^[1-9]\d*$/;

/** Painel de filtros (componente de apresentação): recebe dados por `input` e avisa por `output`. */
@Component({
  selector: 'app-filtros-lotes',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    CampoMonetario,
    MascaraData,
  ],
  templateUrl: './filtros-lotes.html',
  styleUrl: './filtros-lotes.scss',
})
export class FiltrosLotes {
  readonly instituicoes = input.required<readonly Instituicao[]>();

  protected readonly todas = TODAS;
  protected readonly situacoes = SITUACOES_LOTE;
  protected readonly rotuloSituacao = ROTULO_SITUACAO_LOTE;
  protected readonly erroNaFaixa = new ErroNaFaixa();

  /** Sem a lista de instituições, mostra ao menos o código. */
  protected readonly instituicaoResponsavel = computed(() => {
    const codigo = FILTROS_PADRAO.instituicaoResponsavel;
    const instituicao = this.instituicoes().find((item) => item.codigo === codigo);
    return instituicao ? `${instituicao.codigo} - ${instituicao.nome}` : codigo;
  });

  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    instituicao: [FILTROS_PADRAO.instituicao],
    situacao: this.fb.control<SituacaoLote | typeof TODAS>(TODAS),
    idLote: this.fb.group(
      {
        de: ['', Validators.pattern(INTEIRO_POSITIVO)],
        ate: ['', Validators.pattern(INTEIRO_POSITIVO)],
      },
      { validators: validarFaixa },
    ),
    valorCentavos: this.fb.group(
      {
        de: this.fb.control<number | null>(null),
        ate: this.fb.control<number | null>(null),
      },
      { validators: validarFaixa },
    ),
    dataEntrada: this.fb.group(
      {
        de: this.fb.control<Date | null>(null),
        ate: this.fb.control<Date | null>(null),
      },
      { validators: validarFaixa },
    ),
  });

  /** Cliques em Pesquisar com o formulário válido. */
  private readonly envios = new Subject<void>();

  /** A última pesquisa pedida. Ao abrir, a página pesquisa os filtros padrão. */
  private ultimaPesquisa = FILTROS_PADRAO;

  /**
   * Pesquisas pedidas pelo usuário, por dois caminhos:
   * - Pesquisar (CL-06): na hora, mesmo com os filtros iguais, para atualizar os dados;
   * - alteração de filtro (CL-07): 400 ms depois da última alteração (debounce), só com os
   *   filtros válidos e se for diferente da última pesquisa, feita por qualquer dos caminhos.
   * O `share()` garante um único fluxo, mesmo com mais de um inscrito.
   */
  readonly pesquisar = outputFromObservable(
    merge(
      this.envios.pipe(map(() => this.paraFiltros())),
      this.form.valueChanges.pipe(
        debounceTime(inject(ATRASO_PESQUISA_AUTOMATICA_MS)),
        filter(() => this.form.valid),
        map(() => this.paraFiltros()),
        filter((filtros) => !mesmosFiltros(filtros, this.ultimaPesquisa)),
      ),
    ).pipe(
      tap((filtros) => (this.ultimaPesquisa = filtros)),
      share(),
    ),
  );

  protected aoPesquisar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.envios.next();
  }

  /** Converte os valores da tela (texto, Date) para o modelo (número, `AAAA-MM-DD`). */
  private paraFiltros(): FiltrosLote {
    const valor = this.form.getRawValue();
    const inteiro = (texto: string) => (texto === '' ? null : Number(texto));
    const data = (dia: Date | null) => (dia ? paraDataIso(dia) : null);

    return {
      instituicaoResponsavel: FILTROS_PADRAO.instituicaoResponsavel,
      instituicao: valor.instituicao,
      situacao: valor.situacao === TODAS ? null : valor.situacao,
      idLote: { de: inteiro(valor.idLote.de), ate: inteiro(valor.idLote.ate) },
      valorCentavos: valor.valorCentavos,
      dataEntrada: { de: data(valor.dataEntrada.de), ate: data(valor.dataEntrada.ate) },
    };
  }
}
