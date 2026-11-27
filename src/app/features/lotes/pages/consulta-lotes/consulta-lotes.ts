import {
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  linkedSignal,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, finalize, Observable, of, retry } from 'rxjs';
import {
  DadosDialogoMensagem,
  DialogoMensagem,
} from '../../../../shared/components/dialogo-mensagem/dialogo-mensagem';
import { Paginacao } from '../../../../shared/components/paginacao/paginacao';
import { Pagina } from '../../../../shared/models/pagina';
import { BarraAcoes } from '../../components/barra-acoes/barra-acoes';
import { FILTROS_PADRAO, FiltrosLotes } from '../../components/filtros-lotes/filtros-lotes';
import {
  DadosModalLancamento,
  IncluirLancamento,
} from '../../components/incluir-lancamento/incluir-lancamento';
import { TabelaLotes } from '../../components/tabela-lotes/tabela-lotes';
import { CadastrosApi } from '../../data-access/cadastros-api';
import { LotesApi } from '../../data-access/lotes-api';
import { FiltrosLote } from '../../models/filtros-lote';
import { Lote } from '../../models/lote';
import { AcaoLote } from '../../regras/acoes-lote';

/** CL-13: 10 lotes por página. */
const TAMANHO_PAGINA = 10;

/** CL-09: uma nova tentativa automática, depois de uma pausa curta, antes de mostrar o erro. */
const NOVA_TENTATIVA = { count: 1, delay: 300 };

/** "Lote 3 enviado." ou "2 lotes enviados." */
function mensagemDeSucesso(ids: readonly number[], participio: string): string {
  return ids.length === 1
    ? `Lote ${ids[0]} ${participio}.`
    : `${ids.length} lotes ${participio.replace(/o$/, 'os')}.`;
}

/** Página da consulta (container): guarda o estado e o repassa aos componentes. */
@Component({
  selector: 'app-consulta-lotes',
  imports: [
    BarraAcoes,
    FiltrosLotes,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    Paginacao,
    TabelaLotes,
  ],
  templateUrl: './consulta-lotes.html',
  styleUrl: './consulta-lotes.scss',
})
export class ConsultaLotes {
  private readonly cadastros = inject(CadastrosApi);
  private readonly lotesApi = inject(LotesApi);
  private readonly dialogo = inject(MatDialog);
  private readonly avisos = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  /** Se a lista falhar, os filtros continuam utilizáveis com os valores padrão. */
  protected readonly instituicoes = toSignal(
    this.cadastros.listarInstituicoes().pipe(catchError(() => of([]))),
    { initialValue: [] },
  );

  /** O que pesquisar. Ao abrir, os filtros padrão na primeira página (CL-06). */
  private readonly consulta = signal({ filtros: FILTROS_PADRAO, pagina: 1 });

  /**
   * Refaz a pesquisa sempre que a consulta muda e descarta a resposta anterior ainda pendente
   * (CL-07). Expõe carregamento, erro e `reload()`.
   */
  private readonly resultado = rxResource({
    params: () => this.consulta(),
    stream: ({ params }) =>
      this.lotesApi
        .pesquisar(params.filtros, params.pagina, TAMANHO_PAGINA)
        .pipe(retry(NOVA_TENTATIVA)),
  });

  /**
   * Quando a consulta muda, o resource volta a não ter valor até a resposta chegar. Guardar a
   * última página recebida evita que a tabela pisque vazia e a paginação suma durante a troca.
   */
  private readonly ultimaPagina = linkedSignal<Pagina<Lote> | undefined, Pagina<Lote> | undefined>({
    source: () => (this.resultado.hasValue() ? this.resultado.value() : undefined),
    computation: (atual, anterior) => atual ?? anterior?.value,
  });

  protected readonly lotes = computed(() => this.ultimaPagina()?.itens ?? []);
  protected readonly total = computed(() => this.ultimaPagina()?.total ?? 0);
  protected readonly paginaAtual = computed(() => this.consulta().pagina);
  protected readonly tamanhoPagina = TAMANHO_PAGINA;

  protected readonly carregando = this.resultado.isLoading;
  protected readonly falhou = computed(() => this.resultado.status() === 'error');

  /** Texto lido pelo leitor de tela quando a pesquisa começa e termina (CL-08). */
  protected readonly anuncio = computed(() => {
    if (this.carregando()) {
      return 'Pesquisando lotes…';
    }
    if (this.falhou()) {
      return '';
    }
    const total = this.total();
    return total === 0
      ? 'Nenhum lote encontrado.'
      : `${total} ${total === 1 ? 'lote encontrado' : 'lotes encontrados'}.`;
  });

  protected readonly selecionados = signal<ReadonlySet<number>>(new Set());
  protected readonly lotesSelecionados = computed(() =>
    this.lotes().filter((lote) => this.selecionados().has(lote.id)),
  );

  /** Uma ação em andamento desabilita a barra, para o mesmo pedido não ser feito duas vezes. */
  protected readonly executando = signal(false);

  protected aoPesquisar(filtros: FiltrosLote): void {
    this.consulta.set({ filtros, pagina: 1 });
    this.selecionados.set(new Set());
  }

  /** CL-09: nova inscrição no mesmo pedido; o servidor simulado relê a URL. */
  protected tentarNovamente(): void {
    this.resultado.reload();
  }

  /** CL-12: a seleção vale só para a página atual. */
  protected aoTrocarPagina(pagina: number): void {
    this.consulta.update((consulta) => ({ ...consulta, pagina }));
    this.selecionados.set(new Set());
  }

  protected aoAcionar(acao: AcaoLote): void {
    const lotes = this.lotesSelecionados();
    const ids = lotes.map((lote) => lote.id);

    switch (acao) {
      case 'enviar':
        this.executar(this.lotesApi.enviar(ids), mensagemDeSucesso(ids, 'enviado'), 'enviar');
        break;
      case 'confirmar':
        this.executar(
          this.lotesApi.confirmar(ids),
          mensagemDeSucesso(ids, 'confirmado'),
          'confirmar',
        );
        break;
      case 'excluir':
        this.confirmarExclusao(lotes[0]);
        break;
      case 'justificativa':
        this.abrirDialogo({
          titulo: `Justificativa do lote ${lotes[0].id}`,
          mensagem: lotes[0].justificativa ?? '',
        });
        break;
      case 'incluir':
        this.abrirModalLancamentos({ lote: null });
        break;
      case 'alterar':
        this.abrirModalLancamentos({ lote: lotes[0] });
        break;
      case 'visualizar':
        this.abrirModalLancamentos({ lote: lotes[0], somenteLeitura: true });
        break;
    }
  }

  /**
   * CL-15 (lote novo), CL-16 (Alterar) e CL-18 (Visualizar). Ao fechar, a consulta é refeita
   * para mostrar o lote com a quantidade e o valor atualizados (IL-16).
   */
  private abrirModalLancamentos(dados: DadosModalLancamento): void {
    this.dialogo
      .open<IncluirLancamento, DadosModalLancamento>(IncluirLancamento, {
        data: dados,
        // DS-20: 800 px, para a grade de lançamentos caber sem rolagem horizontal.
        width: 'min(800px, 100vw)',
        maxWidth: '100vw',
        // IL-01: o foco começa no primeiro campo, a Conta Corrente.
        autoFocus: '#conta-corrente',
        // O modal usa as APIs registradas na rota de lotes: precisa do injetor da página. Sem
        // isso, o MatDialog usaria o injetor da raiz, onde essas APIs não existem.
        injector: this.injector,
      })
      .afterClosed()
      .subscribe(() => this.resultado.reload());
  }

  private confirmarExclusao(lote: Lote): void {
    this.abrirDialogo({
      titulo: 'Excluir lote',
      mensagem: `Excluir o lote ${lote.id}? Esta ação não pode ser desfeita.`,
      confirmar: 'Excluir',
    })
      .afterClosed()
      .pipe(filter(Boolean))
      .subscribe(() =>
        this.executar(
          this.lotesApi.excluir(lote.id),
          mensagemDeSucesso([lote.id], 'excluído'),
          'excluir',
        ),
      );
  }

  private abrirDialogo(dados: DadosDialogoMensagem) {
    return this.dialogo.open<DialogoMensagem, DadosDialogoMensagem, boolean>(DialogoMensagem, {
      data: dados,
      width: '420px',
    });
  }

  /**
   * Executa uma ação e, se der certo, avisa, limpa a seleção e refaz a pesquisa (CL-22). Se
   * falhar, avisa e mantém a seleção para o usuário tentar de novo. Ações que alteram dados não
   * têm nova tentativa automática: repetir um envio sem saber se o primeiro chegou é arriscado.
   */
  private executar(operacao: Observable<void>, sucesso: string, verbo: string): void {
    const afetados = this.selecionados().size;
    this.executando.set(true);
    operacao
      .pipe(
        finalize(() => this.executando.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.avisar(sucesso);
          this.selecionados.set(new Set());
          this.refazerPesquisa(afetados);
        },
        error: () => this.avisar(`Não foi possível ${verbo} os lotes.`),
      });
  }

  /** Se a ação afetou todos os lotes da página, ela pode ter ficado vazia: volta uma página. */
  private refazerPesquisa(afetados: number): void {
    const { pagina } = this.consulta();
    if (afetados === this.lotes().length && pagina > 1) {
      this.consulta.update((consulta) => ({ ...consulta, pagina: pagina - 1 }));
    } else {
      this.resultado.reload();
    }
  }

  /** DS-24: aviso no rodapé, anunciado ao leitor de tela pelo próprio MatSnackBar. */
  private avisar(mensagem: string): void {
    this.avisos.open(mensagem, 'Fechar', { duration: 5000 });
  }
}
