import { Component, computed, inject, input, output } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
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
  readonly pesquisar = output<FiltrosLote>();

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

  protected aoPesquisar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.pesquisar.emit(this.paraFiltros());
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
