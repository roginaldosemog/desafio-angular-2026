import {
  afterNextRender,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormGroupDirective,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, finalize, startWith, take } from 'rxjs';
import { CampoMonetario } from '../../../../shared/directives/campo-monetario';
import { valorPositivo } from '../../../../shared/forms/validadores';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { LancamentosApi } from '../../data-access/lancamentos-api';
import { contaCorrenteExistente } from '../../forms/conta-corrente-existente';
import { DadosLancamento, Lancamento, ROTULO_SITUACAO_LANCAMENTO } from '../../models/lancamento';
import { GradeLancamentos } from '../grade-lancamentos/grade-lancamentos';

/**
 * Campos na ordem da tela: caminho do controle no formulário → id do elemento. Usado para focar o
 * primeiro inválido (IL-12) sem depender de detalhes internos do Material.
 */
const ORDEM_DOS_CAMPOS: readonly (readonly [string, string])[] = [
  ['conta.numero', 'conta-corrente'],
  ['conta.valorCentavos', 'valor'],
  ['conta.historicoId', 'historico'],
  ['conta.documento', 'documento'],
  ['conta.descricao', 'descricao'],
  ['documentoCsc.paId', 'pa'],
];

/** O que a página informa ao abrir o modal. */
export interface DadosModalLancamento {
  /** Lote em edição; `null` para um lote novo (CL-15). */
  readonly loteId: number | null;
}

/**
 * Modal de inclusão de lançamentos (IL-01 a IL-16). Aberto pelo MatDialog, que cuida do foco
 * preso no modal, do Esc e de devolver o foco ao botão que o abriu.
 */
@Component({
  selector: 'app-incluir-lancamento',
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    CampoMonetario,
    GradeLancamentos,
  ],
  templateUrl: './incluir-lancamento.html',
  styleUrl: './incluir-lancamento.scss',
})
export class IncluirLancamento {
  private readonly dados = inject<DadosModalLancamento>(MAT_DIALOG_DATA);
  private readonly cadastros = inject(CadastrosApi);
  private readonly lancamentosApi = inject(LancamentosApi);
  private readonly avisos = inject(MatSnackBar);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly historicos = toSignal(this.cadastros.listarHistoricos(), { initialValue: [] });
  protected readonly pontosAtendimento = toSignal(this.cadastros.listarPontosAtendimento(), {
    initialValue: [],
  });
  protected readonly situacao = ROTULO_SITUACAO_LANCAMENTO.PENDENTE;

  /** Lote em edição. Num lote novo, fica nulo até o primeiro lançamento criá-lo. */
  private readonly loteId = signal(this.dados.loteId);
  protected readonly lancamentos = signal<readonly Lancamento[]>([]);
  /** Titular da conta encontrada pela lupa (IL-03). */
  protected readonly titular = signal('');
  protected readonly salvando = signal(false);

  private readonly campoConta = viewChild.required<ElementRef<HTMLInputElement>>('campoConta');
  private readonly formulario = viewChild.required(FormGroupDirective);

  private readonly fb = inject(NonNullableFormBuilder);

  /** Um grupo por seção da tela (IL-02); o valor vira `DadosLancamento` em `paraDados`. */
  protected readonly form = this.fb.group({
    conta: this.fb.group({
      // Validada ao sair do campo (e pela lupa), e não a cada tecla: a busca vai ao servidor.
      numero: this.fb.control('', {
        validators: [Validators.required, Validators.pattern(/^\d+$/)],
        asyncValidators: [
          contaCorrenteExistente(
            (numero) => this.cadastros.buscarContaCorrente(numero),
            (conta) => this.titular.set(conta?.titular ?? ''),
          ),
        ],
        updateOn: 'blur',
      }),
      valorCentavos: this.fb.control<number | null>(null, [Validators.required, valorPositivo]),
      historicoId: this.fb.control<number | null>(null, Validators.required),
      estorno: [false],
      documento: ['', [Validators.required, Validators.maxLength(20)]],
      descricao: ['', Validators.maxLength(200)],
    }),
    documentoCsc: this.fb.group({
      paId: this.fb.control<number | null>(null, Validators.required),
    }),
  });

  /** "Manter dados na tela": fora do formulário, porque não é dado do lançamento. */
  protected readonly manterDados = this.fb.control(false);

  constructor() {
    const loteId = this.dados.loteId;
    if (loteId !== null) {
      this.lancamentosApi
        .listar(loteId)
        .pipe(takeUntilDestroyed())
        .subscribe((lancamentos) => this.lancamentos.set(lancamentos));
    }
  }

  /** IL-03: Enter no campo ou a lupa buscam a conta digitada, sem incluir o lançamento. */
  protected buscarConta(evento?: Event): void {
    evento?.preventDefault();
    const numero = this.form.controls.conta.controls.numero;
    // Com updateOn: 'blur', o texto só chega ao controle ao sair do campo: aqui, confirma já.
    numero.setValue(this.campoConta().nativeElement.value);
    numero.markAsTouched();
  }

  /** IL-12 e IL-13: só grava com o formulário válido. */
  protected incluir(): void {
    if (this.salvando()) {
      return;
    }
    this.form.markAllAsTouched();
    // Se a conta ainda está sendo validada no servidor (PENDING), espera a resposta.
    this.form.statusChanges
      .pipe(
        startWith(this.form.status),
        filter((status) => status !== 'PENDING'),
        take(1),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((status) => (status === 'VALID' ? this.gravar() : this.focarPrimeiroInvalido()));
  }

  private gravar(): void {
    this.salvando.set(true);
    this.lancamentosApi
      .incluir(this.loteId(), this.paraDados())
      .pipe(
        finalize(() => this.salvando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lancamento) => {
          this.loteId.set(lancamento.loteId);
          this.lancamentos.update((lista) => [...lista, lancamento]);
          this.avisos.open(`Lançamento incluído no lote ${lancamento.loteId}.`, 'Fechar', {
            duration: 4000,
          });
          if (!this.manterDados.value) {
            // resetForm (e não só reset): também zera o "enviado", senão os erros reapareceriam.
            this.formulario().resetForm();
            this.titular.set('');
          }
          this.focar(() => this.campoConta().nativeElement);
        },
        error: () =>
          this.avisos.open('Não foi possível incluir o lançamento.', 'Fechar', { duration: 5000 }),
      });
  }

  /**
   * IL-12: o foco vai para o primeiro campo inválido, na ordem da tela. (O Material não marca
   * `aria-invalid` em obrigatório vazio, então procurar por esse atributo pularia campos.)
   */
  private focarPrimeiroInvalido(): void {
    const primeiro = ORDEM_DOS_CAMPOS.find(([caminho]) => this.form.get(caminho)?.invalid);
    this.focar(() =>
      primeiro ? this.elemento.nativeElement.querySelector<HTMLElement>(`#${primeiro[1]}`) : null,
    );
  }

  /** Foca depois da próxima renderização, quando os estados de erro já estão na tela. */
  private focar(alvo: () => HTMLElement | null): void {
    afterNextRender(() => alvo()?.focus(), { injector: this.injector });
  }

  /** Converte o valor da tela para o modelo. Só é chamado com o formulário válido. */
  private paraDados(): DadosLancamento {
    const { conta, documentoCsc } = this.form.getRawValue();
    if (conta.valorCentavos === null || conta.historicoId === null || documentoCsc.paId === null) {
      throw new Error('Formulário incompleto.');
    }
    return {
      contaCorrente: conta.numero.trim(),
      valorCentavos: conta.valorCentavos,
      historicoId: conta.historicoId,
      estorno: conta.estorno,
      documento: conta.documento.trim(),
      descricao: conta.descricao.trim(),
      // Evento, complemento e anexos: Documento CSC completo, nos próximos passos (IL-08 a IL-10).
      documentoCsc: {
        paId: documentoCsc.paId,
        eventoId: null,
        complementoHistorico: '',
        idDocumentoCsc: '',
      },
      anexos: [],
    };
  }
}
