import { formatDate } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  Injector,
  LOCALE_ID,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroupDirective,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter, finalize, map, Observable, startWith, switchMap, take } from 'rxjs';
import {
  DadosDialogoMensagem,
  DialogoMensagem,
} from '../../../../shared/components/dialogo-mensagem/dialogo-mensagem';
import { CampoMonetario } from '../../../../shared/directives/campo-monetario';
import { paraDataHoraIso } from '../../../../shared/datas/datas-pt-br';
import { valorPositivo } from '../../../../shared/forms/validadores';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { LancamentosApi } from '../../data-access/lancamentos-api';
import { existeNoCadastro } from '../../forms/existe-no-cadastro';
import { Evento } from '../../models/cadastros';
import {
  Anexo,
  DadosLancamento,
  Lancamento,
  ROTULO_SITUACAO_DOCUMENTO_CSC,
  ROTULO_SITUACAO_LANCAMENTO,
} from '../../models/lancamento';
import { Lote } from '../../models/lote';
import { GradeAnexos } from '../grade-anexos/grade-anexos';
import { GradeLancamentos } from '../grade-lancamentos/grade-lancamentos';
import { PesquisaEvento } from '../pesquisa-evento/pesquisa-evento';

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
  ['documentoCsc.eventoId', 'evento'],
  ['documentoCsc.complementoHistorico', 'complemento-historico'],
  ['documentoCsc.idDocumentoCsc', 'id-documento-csc'],
];

/** O que a página informa ao abrir o modal. */
export interface DadosModalLancamento {
  /** Lote em edição; `null` para um lote novo (CL-15). */
  readonly lote: Lote | null;
  /** CL-18: só visualizar o lote e seus lançamentos. */
  readonly somenteLeitura?: boolean;
}

/**
 * O que o formulário está fazendo (IL-15). União discriminada: o `id` do lançamento só existe
 * nos modos que trabalham sobre um lançamento da grade, e o compilador garante isso.
 */
type Modo =
  | { readonly tipo: 'incluir' }
  | { readonly tipo: 'alterar'; readonly id: number }
  | { readonly tipo: 'visualizar'; readonly id: number };

/**
 * Modal de lançamentos (IL-01 a IL-16). Aberto pelo MatDialog, que cuida do foco preso no modal,
 * do Esc e de devolver o foco ao botão que o abriu.
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
    GradeAnexos,
    GradeLancamentos,
  ],
  templateUrl: './incluir-lancamento.html',
  styleUrl: './incluir-lancamento.scss',
})
export class IncluirLancamento {
  private readonly dados = inject<DadosModalLancamento>(MAT_DIALOG_DATA);
  private readonly cadastros = inject(CadastrosApi);
  private readonly lancamentosApi = inject(LancamentosApi);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);
  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly idioma = inject(LOCALE_ID);

  protected readonly historicos = toSignal(this.cadastros.listarHistoricos(), { initialValue: [] });
  protected readonly pontosAtendimento = toSignal(this.cadastros.listarPontosAtendimento(), {
    initialValue: [],
  });
  protected readonly situacao = ROTULO_SITUACAO_LANCAMENTO.PENDENTE;
  protected readonly situacaoDocumentoCsc =
    ROTULO_SITUACAO_DOCUMENTO_CSC.AGUARDANDO_PROCESSAMENTO_CCO;

  protected readonly somenteLeitura = this.dados.somenteLeitura ?? false;
  protected readonly titulo =
    this.somenteLeitura && this.dados.lote
      ? `Visualizar Lote ${this.dados.lote.id}`
      : 'Incluir Lançamento';

  /** Lote em edição. Num lote novo, fica nulo até o primeiro lançamento criá-lo. */
  private readonly loteId = signal(this.dados.lote?.id ?? null);
  protected readonly lancamentos = signal<readonly Lancamento[]>([]);
  protected readonly selecionadosNaGrade = signal<ReadonlySet<number>>(new Set());
  protected readonly modo = signal<Modo>({ tipo: 'incluir' });
  /** Titular da conta encontrada pela lupa (IL-03). */
  protected readonly titular = signal('');
  /** Descrição do evento encontrado (IL-08). */
  protected readonly descricaoEvento = signal('');
  protected readonly salvando = signal(false);

  /** IL-14: as ações da grade trabalham sobre exatamente um lançamento selecionado. */
  protected readonly selecionado = computed(() => {
    const ids = [...this.selecionadosNaGrade()];
    return ids.length === 1
      ? (this.lancamentos().find((item) => item.id === ids[0]) ?? null)
      : null;
  });

  /** Documento do lançamento em alteração ou visualização, para o aviso do modo. */
  protected readonly documentoDoModo = computed(() => {
    const modo = this.modo();
    return modo.tipo === 'incluir'
      ? ''
      : (this.lancamentos().find((item) => item.id === modo.id)?.documento ?? '');
  });

  protected readonly podeSalvar = computed(
    () => !this.somenteLeitura && this.modo().tipo !== 'visualizar',
  );
  protected readonly textoSalvar = computed(() =>
    this.modo().tipo === 'alterar' ? 'Salvar alteração' : 'Incluir',
  );

  private readonly campoConta = viewChild.required<ElementRef<HTMLInputElement>>('campoConta');
  private readonly campoEvento = viewChild.required<ElementRef<HTMLInputElement>>('campoEvento');
  private readonly formulario = viewChild.required(FormGroupDirective);

  private readonly fb = inject(NonNullableFormBuilder);

  /** Um grupo por seção da tela (IL-02); o valor vira `DadosLancamento` em `paraDados`. */
  protected readonly form = this.fb.group({
    conta: this.fb.group({
      // Validada ao sair do campo (e pela lupa), e não a cada tecla: a busca vai ao servidor.
      numero: this.fb.control('', {
        validators: [Validators.required, Validators.pattern(/^\d+$/)],
        asyncValidators: [
          existeNoCadastro(
            (numero) => this.cadastros.buscarContaCorrente(numero),
            (conta) => this.titular.set(conta?.titular ?? ''),
            'contaNaoEncontrada',
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
      // Opcional; se informado, precisa existir. Validado como a conta: ao sair do campo.
      eventoId: this.fb.control('', {
        validators: [Validators.pattern(/^\d+$/)],
        asyncValidators: [
          existeNoCadastro<Evento>(
            (id) => this.cadastros.buscarEvento(Number(id)),
            (evento) => this.descricaoEvento.set(evento?.descricao ?? ''),
            'eventoNaoEncontrado',
          ),
        ],
        updateOn: 'blur',
      }),
      complementoHistorico: ['', [Validators.required, Validators.maxLength(200)]],
      idDocumentoCsc: ['', Validators.maxLength(20)],
    }),
    // IL-10: lista que cresce e diminui, parte do valor do formulário.
    anexos: this.fb.array<FormControl<Anexo>>([]),
  });

  /** Os anexos na tela, como signal: a grade acompanha cada inclusão e exclusão. */
  protected readonly anexos = toSignal(
    this.form.controls.anexos.valueChanges.pipe(map(() => this.form.controls.anexos.getRawValue())),
    { initialValue: [] },
  );
  protected readonly anexoSelecionado = signal<number | null>(null);

  /** "Manter dados na tela": fora do formulário, porque não é dado do lançamento. */
  protected readonly manterDados = this.fb.control(false);

  constructor() {
    if (this.somenteLeitura) {
      this.form.disable();
    }
    const loteId = this.loteId();
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

  /** IL-08: Enter no campo busca o evento digitado, sem incluir o lançamento. */
  protected buscarEvento(evento: Event): void {
    evento.preventDefault();
    const controle = this.form.controls.documentoCsc.controls.eventoId;
    controle.setValue(this.campoEvento().nativeElement.value);
    controle.markAsTouched();
  }

  /** IL-08: a lupa abre a Pesquisa Evento; o evento escolhido preenche o campo. */
  protected abrirPesquisaEvento(): void {
    this.dialogo
      .open<PesquisaEvento, void, Evento>(PesquisaEvento, {
        // 680 px: as seis colunas da tabela cabem sem rolagem horizontal (DS-23).
        width: 'min(680px, 100vw)',
        maxWidth: '100vw',
        autoFocus: '#valor-busca',
        // A pesquisa usa a CadastrosApi da rota: o injetor deste modal a enxerga.
        injector: this.injector,
      })
      .afterClosed()
      .pipe(
        filter((evento): evento is Evento => evento !== undefined),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((evento) => {
        const controle = this.form.controls.documentoCsc.controls.eventoId;
        controle.setValue(String(evento.id));
        controle.markAsTouched();
      });
  }

  /** IL-10: cada arquivo escolhido vira um anexo; o usuário é registrado pelo servidor. */
  protected adicionarArquivos(evento: Event): void {
    const seletor = evento.target as HTMLInputElement;
    const agora = paraDataHoraIso(new Date());
    for (const arquivo of Array.from(seletor.files ?? [])) {
      this.form.controls.anexos.push(
        this.fb.control<Anexo>({
          nomeArquivo: arquivo.name,
          descricao: arquivo.name,
          dataHoraInclusao: agora,
          usuario: '',
        }),
      );
    }
    // Limpa o seletor: escolher o mesmo arquivo de novo também dispara o "change".
    seletor.value = '';
  }

  protected visualizarAnexo(): void {
    const posicao = this.anexoSelecionado();
    const anexo = posicao === null ? undefined : this.anexos()[posicao];
    if (anexo) {
      const quando = formatDate(anexo.dataHoraInclusao, 'dd/MM/yyyy HH:mm', this.idioma);
      const quem = anexo.usuario ? ` por ${anexo.usuario}` : '';
      this.dialogo.open<DialogoMensagem, DadosDialogoMensagem>(DialogoMensagem, {
        data: {
          titulo: `Anexo ${anexo.nomeArquivo}`,
          mensagem: `${anexo.descricao}. Incluído em ${quando}${quem}.`,
        },
        width: '420px',
      });
    }
  }

  protected excluirAnexo(): void {
    const posicao = this.anexoSelecionado();
    if (posicao !== null) {
      this.form.controls.anexos.removeAt(posicao);
      this.anexoSelecionado.set(null);
    }
  }

  /** IL-12, IL-13 e IL-15: inclui ou salva a alteração, só com o formulário válido. */
  protected salvar(): void {
    if (this.salvando() || !this.podeSalvar()) {
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

  /** IL-15: carrega o lançamento sem permitir edição. */
  protected visualizar(): void {
    const lancamento = this.selecionado();
    if (lancamento) {
      this.carregar(lancamento);
      this.form.disable();
      this.modo.set({ tipo: 'visualizar', id: lancamento.id });
    }
  }

  /** IL-15: carrega o lançamento para edição; o botão principal passa a salvar a alteração. */
  protected alterar(): void {
    const lancamento = this.selecionado();
    if (lancamento) {
      this.carregar(lancamento);
      this.form.enable();
      this.modo.set({ tipo: 'alterar', id: lancamento.id });
      this.focar(() => this.campoConta().nativeElement);
    }
  }

  /** IL-15: carrega uma cópia, que será incluída como lançamento novo. */
  protected duplicar(): void {
    const lancamento = this.selecionado();
    if (lancamento) {
      this.carregar(lancamento);
      this.form.enable();
      this.modo.set({ tipo: 'incluir' });
      this.focar(() => this.campoConta().nativeElement);
    }
  }

  /** IL-15: pede confirmação e remove o lançamento. */
  protected excluir(): void {
    const lancamento = this.selecionado();
    if (!lancamento) {
      return;
    }
    this.dialogo
      .open<DialogoMensagem, DadosDialogoMensagem, boolean>(DialogoMensagem, {
        data: {
          titulo: 'Excluir lançamento',
          mensagem: `Excluir o lançamento ${lancamento.documento}? Esta ação não pode ser desfeita.`,
          confirmar: 'Excluir lançamento',
        },
        width: '420px',
      })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.lancamentosApi.excluir(lancamento.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.lancamentos.update((lista) => lista.filter((item) => item.id !== lancamento.id));
          this.selecionadosNaGrade.set(new Set());
          this.avisar(`Lançamento ${lancamento.documento} excluído.`);
          const modo = this.modo();
          if (modo.tipo !== 'incluir' && modo.id === lancamento.id) {
            this.voltarParaInclusao();
          }
        },
        error: () => this.avisar('Não foi possível excluir o lançamento.'),
      });
  }

  /** Sai de Alterar ou Visualizar e volta ao formulário vazio de inclusão. */
  protected voltarParaInclusao(): void {
    this.modo.set({ tipo: 'incluir' });
    // O FormArray precisa ser esvaziado: o reset só volta o valor de cada anexo existente.
    this.form.controls.anexos.clear();
    this.anexoSelecionado.set(null);
    // resetForm (e não só reset): também zera o "enviado", senão os erros reapareceriam.
    this.formulario().resetForm();
    this.titular.set('');
    this.descricaoEvento.set('');
    if (!this.somenteLeitura) {
      this.form.enable();
    }
  }

  private gravar(): void {
    const modo = this.modo();
    const dados = this.paraDados();
    const operacao: Observable<Lancamento> =
      modo.tipo === 'alterar'
        ? this.lancamentosApi.alterar(modo.id, dados)
        : this.lancamentosApi.incluir(this.loteId(), dados);

    this.salvando.set(true);
    operacao
      .pipe(
        finalize(() => this.salvando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (lancamento) =>
          modo.tipo === 'alterar'
            ? this.concluirAlteracao(lancamento)
            : this.concluirInclusao(lancamento),
        error: () =>
          this.avisar(
            modo.tipo === 'alterar'
              ? 'Não foi possível alterar o lançamento.'
              : 'Não foi possível incluir o lançamento.',
          ),
      });
  }

  private concluirInclusao(lancamento: Lancamento): void {
    this.loteId.set(lancamento.loteId);
    this.lancamentos.update((lista) => [...lista, lancamento]);
    this.avisar(`Lançamento incluído no lote ${lancamento.loteId}.`);
    if (!this.manterDados.value) {
      this.voltarParaInclusao();
    }
    this.focar(() => this.campoConta().nativeElement);
  }

  private concluirAlteracao(lancamento: Lancamento): void {
    this.lancamentos.update((lista) =>
      lista.map((item) => (item.id === lancamento.id ? lancamento : item)),
    );
    this.avisar(`Lançamento ${lancamento.documento} alterado.`);
    this.voltarParaInclusao();
    this.focar(() => this.campoConta().nativeElement);
  }

  /** Lançamento → valores da tela. O `resetForm` também limpa "tocado" e "enviado". */
  private carregar(lancamento: Lancamento): void {
    // O reset preenche controles existentes: primeiro, um controle por anexo do lançamento.
    this.form.controls.anexos.clear();
    for (const anexo of lancamento.anexos) {
      this.form.controls.anexos.push(this.fb.control(anexo));
    }
    this.anexoSelecionado.set(null);
    this.formulario().resetForm({
      conta: {
        numero: lancamento.contaCorrente,
        valorCentavos: lancamento.valorCentavos,
        historicoId: lancamento.historicoId,
        estorno: lancamento.estorno,
        documento: lancamento.documento,
        descricao: lancamento.descricao,
      },
      documentoCsc: {
        paId: lancamento.documentoCsc.paId,
        eventoId: lancamento.documentoCsc.eventoId?.toString() ?? '',
        complementoHistorico: lancamento.documentoCsc.complementoHistorico,
        idDocumentoCsc: lancamento.documentoCsc.idDocumentoCsc,
      },
      anexos: [...lancamento.anexos],
    });
    this.titular.set(lancamento.titular);
    // Com o formulário desabilitado (Visualizar), o validador não roda: busca a descrição aqui.
    this.descricaoEvento.set('');
    const eventoId = lancamento.documentoCsc.eventoId;
    if (eventoId !== null) {
      this.cadastros
        .buscarEvento(eventoId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((evento) => this.descricaoEvento.set(evento?.descricao ?? ''));
    }
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

  private avisar(mensagem: string): void {
    this.avisos.open(mensagem, 'Fechar', { duration: 4000 });
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
      documentoCsc: {
        paId: documentoCsc.paId,
        eventoId: documentoCsc.eventoId.trim() === '' ? null : Number(documentoCsc.eventoId),
        complementoHistorico: documentoCsc.complementoHistorico.trim(),
        idDocumentoCsc: documentoCsc.idDocumentoCsc.trim(),
      },
      anexos: this.form.controls.anexos.getRawValue(),
    };
  }
}
