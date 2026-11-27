import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DadosLancamento, Lancamento } from '../models/lancamento';
import { LancamentosApi } from './lancamentos-api';
import { BancoEmMemoria } from './mock/banco-em-memoria';
import { CONTAS_CORRENTES, USUARIO_LOGADO } from './mock/cadastros.mock';
import { ServidorSimulado } from './mock/servidor-simulado';

/** Lançamentos em memória. Valida os dados como um servidor faria: a tela não é a única barreira. */
@Injectable()
export class LancamentosApiMock implements LancamentosApi {
  private readonly servidor = inject(ServidorSimulado);
  private readonly banco = inject(BancoEmMemoria);

  listar(loteId: number): Observable<readonly Lancamento[]> {
    return this.servidor.responder(() =>
      this.banco.lancamentos.filter((lancamento) => lancamento.loteId === loteId),
    );
  }

  incluir(loteId: number | null, dados: DadosLancamento): Observable<Lancamento> {
    return this.servidor.responder(() => {
      const titular = this.validar(dados);
      if (loteId !== null) {
        this.exigirLoteAberto(loteId);
      }
      const lancamento: Lancamento = {
        ...dados,
        id: this.banco.novoIdLancamento(),
        loteId: loteId ?? this.criarLote(),
        titular,
        situacao: 'PENDENTE',
        situacaoDocumentoCsc: 'AGUARDANDO_PROCESSAMENTO_CCO',
      };
      this.banco.lancamentos = [...this.banco.lancamentos, lancamento];
      this.banco.atualizarResumo(lancamento.loteId);
      return lancamento;
    });
  }

  alterar(id: number, dados: DadosLancamento): Observable<Lancamento> {
    return this.servidor.responder(() => {
      const atual = this.buscar(id);
      const titular = this.validar(dados);
      this.exigirLoteAberto(atual.loteId);
      const alterado: Lancamento = { ...atual, ...dados, titular };
      this.banco.lancamentos = this.banco.lancamentos.map((item) =>
        item.id === id ? alterado : item,
      );
      this.banco.atualizarResumo(atual.loteId);
      return alterado;
    });
  }

  excluir(id: number): Observable<void> {
    return this.servidor.responder(() => {
      const atual = this.buscar(id);
      this.exigirLoteAberto(atual.loteId);
      this.banco.lancamentos = this.banco.lancamentos.filter((item) => item.id !== id);
      this.banco.atualizarResumo(atual.loteId);
    });
  }

  /** Valida os dados como um servidor faria e devolve o titular da conta. */
  private validar(dados: DadosLancamento): string {
    const conta = CONTAS_CORRENTES.find((item) => item.numero === dados.contaCorrente);
    if (!conta) {
      throw new Error(`Conta corrente ${dados.contaCorrente} não encontrada.`);
    }
    if (dados.valorCentavos <= 0) {
      throw new Error('O valor deve ser maior que zero.');
    }
    return conta.titular;
  }

  private buscar(id: number): Lancamento {
    const lancamento = this.banco.lancamentos.find((item) => item.id === id);
    if (!lancamento) {
      throw new Error(`Lançamento ${id} não encontrado.`);
    }
    return lancamento;
  }

  /** Lançamentos só mudam em lote Aberto (ciclo Aberto → Enviado → Confirmado). */
  private exigirLoteAberto(loteId: number): void {
    if (this.banco.lotes.find((lote) => lote.id === loteId)?.situacao !== 'ABERTO') {
      throw new Error(`O lote ${loteId} não está Aberto.`);
    }
  }

  /** CL-15: lote novo, Aberto, com a data de hoje e o usuário logado. */
  private criarLote(): number {
    const id = this.banco.novoIdLote();
    this.banco.lotes = [
      ...this.banco.lotes,
      {
        id,
        instituicaoResponsavel: '0001',
        instituicao: '0002',
        dataEntrada: this.servidor.hoje(),
        valorCentavos: 0,
        quantidadeLancamentos: 0,
        usuarioRegistro: USUARIO_LOGADO,
        usuarioAprovacao: null,
        situacao: 'ABERTO',
        dataHoraSituacao: this.servidor.agora(),
        justificativa: null,
      },
    ];
    return id;
  }
}
