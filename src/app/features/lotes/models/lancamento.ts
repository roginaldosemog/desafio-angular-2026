import { DataHoraIso } from '../../../shared/models/datas';

/** No escopo do desafio, todo lançamento incluído fica Pendente. */
export type SituacaoLancamento = 'PENDENTE';

export type SituacaoDocumentoCsc = 'AGUARDANDO_PROCESSAMENTO_CCO';

export const ROTULO_SITUACAO_LANCAMENTO: Record<SituacaoLancamento, string> = {
  PENDENTE: 'Pendente',
};

export const ROTULO_SITUACAO_DOCUMENTO_CSC: Record<SituacaoDocumentoCsc, string> = {
  AGUARDANDO_PROCESSAMENTO_CCO: 'Aguardando Processamento CCO',
};

export interface Anexo {
  readonly nomeArquivo: string;
  readonly descricao: string;
  readonly dataHoraInclusao: DataHoraIso;
  readonly usuario: string;
}

/** Campos da seção Documento CSC preenchidos pelo usuário. */
export interface DadosDocumentoCsc {
  readonly paId: number;
  readonly eventoId: number | null;
  readonly complementoHistorico: string;
  readonly idDocumentoCsc: string;
}

/** O que o formulário envia ao incluir ou alterar um lançamento. */
export interface DadosLancamento {
  readonly contaCorrente: string;
  readonly valorCentavos: number;
  readonly historicoId: number;
  readonly estorno: boolean;
  readonly documento: string;
  readonly descricao: string;
  readonly documentoCsc: DadosDocumentoCsc;
  readonly anexos: readonly Anexo[];
}

/** O lançamento gravado: os dados do usuário mais o que o serviço define. */
export interface Lancamento extends DadosLancamento {
  readonly id: number;
  readonly loteId: number;
  /** Nome do titular da conta, resolvido pelo serviço. */
  readonly titular: string;
  readonly situacao: SituacaoLancamento;
  readonly situacaoDocumentoCsc: SituacaoDocumentoCsc;
}
