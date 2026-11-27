import { DataHoraIso, DataIso } from '../../../../shared/models/datas';
import { Anexo, Lancamento } from '../../models/lancamento';
import { Lote, SituacaoLote } from '../../models/lote';
import { CONTAS_CORRENTES, USUARIO_LOGADO } from './cadastros.mock';

function titularDa(contaCorrente: string): string {
  const conta = CONTAS_CORRENTES.find((item) => item.numero === contaCorrente);
  if (!conta) {
    throw new Error(`Conta ${contaCorrente} não cadastrada no mock.`);
  }
  return conta.titular;
}

interface VariacoesLancamento {
  readonly historicoId?: number;
  readonly estorno?: boolean;
  readonly descricao?: string;
  readonly paId?: number;
  readonly eventoId?: number | null;
  readonly anexos?: readonly Anexo[];
}

/** Monta um lançamento com valores padrão; só o que varia é informado. */
function lancamento(
  id: number,
  loteId: number,
  contaCorrente: string,
  valorCentavos: number,
  variacoes: VariacoesLancamento = {},
): Lancamento {
  const {
    historicoId = 1,
    estorno = false,
    descricao = '',
    paId = 1,
    eventoId = 102,
    anexos = [],
  } = variacoes;

  return {
    id,
    loteId,
    contaCorrente,
    titular: titularDa(contaCorrente),
    valorCentavos,
    historicoId,
    estorno,
    documento: `DOC-${String(id).padStart(4, '0')}`,
    descricao,
    situacao: 'PENDENTE',
    documentoCsc: {
      paId,
      eventoId,
      complementoHistorico: `Lançamento do lote ${loteId}`,
      idDocumentoCsc: '',
    },
    situacaoDocumentoCsc: 'AGUARDANDO_PROCESSAMENTO_CCO',
    anexos,
  };
}

export const LANCAMENTOS_MOCK: readonly Lancamento[] = [
  lancamento(1, 1, '44444', 150000),
  lancamento(2, 1, '10231', 35050, { historicoId: 2 }),
  // Lote 2: o da imagem de referência, com o anexo mostrado nela.
  lancamento(3, 2, '44444', 100000, {
    descricao: 'Crédito de ajuste de conciliação',
    anexos: [
      {
        nomeArquivo: 'test-incluir2.pdf',
        descricao: 'test-incluir2.pdf',
        dataHoraInclusao: '2026-04-27T12:36:00',
        usuario: USUARIO_LOGADO,
      },
    ],
  }),
  lancamento(4, 3, '20457', 250000, { paId: 2 }),
  lancamento(5, 4, '30982', 12990, { historicoId: 3, eventoId: 110 }),
  lancamento(6, 4, '41126', 8000, { historicoId: 3, eventoId: 110 }),
  lancamento(7, 4, '52340', 45000),
  lancamento(8, 5, '10231', 78000, { historicoId: 4, eventoId: null }),
  lancamento(9, 6, '44444', 500000, { paId: 3 }),
  lancamento(10, 6, '20457', 120000, { paId: 3, eventoId: 103 }),
  lancamento(11, 7, '52340', 1500000, { descricao: 'Repasse de cobrança centralizada' }),
  lancamento(12, 8, '30982', 2575, { historicoId: 3 }),
  lancamento(13, 8, '41126', 9925, { estorno: true, descricao: 'Estorno de tarifa' }),
  lancamento(14, 9, '10231', 33333, { historicoId: 2, paId: 2 }),
  lancamento(15, 10, '20457', 64000),
  lancamento(16, 10, '44444', 16000, { eventoId: 103 }),
  lancamento(17, 11, '52340', 4990, { historicoId: 3, eventoId: 110 }),
  lancamento(18, 12, '41126', 210000, { paId: 2 }),
  lancamento(19, 12, '30982', 90000, { paId: 2 }),
  lancamento(20, 12, '10231', 50000, { paId: 2, historicoId: 4, eventoId: null }),
  lancamento(21, 13, '44444', 27500, {
    anexos: [
      {
        nomeArquivo: 'comprovante-13.pdf',
        descricao: 'Comprovante de depósito',
        dataHoraInclusao: '2026-05-12T10:38:20',
        usuario: 'gearqc0301_00',
      },
    ],
  }),
  lancamento(22, 14, '20457', 300000, { paId: 3 }),
  lancamento(23, 15, '10231', 11000, { historicoId: 2 }),
  lancamento(24, 15, '52340', 22000, { historicoId: 2 }),
  lancamento(25, 16, '30982', 87654, { eventoId: 103 }),
  lancamento(26, 17, '41126', 5000, { historicoId: 3, eventoId: 110 }),
  lancamento(27, 18, '44444', 40000),
  lancamento(28, 18, '20457', 60000, { paId: 2 }),
];

interface VariacoesLote {
  readonly usuarioAprovacao?: string;
  readonly justificativa?: string;
}

/** Monta um lote; valor e quantidade vêm dos seus lançamentos, uma única fonte da verdade. */
function lote(
  id: number,
  dataEntrada: DataIso,
  situacao: SituacaoLote,
  dataHoraSituacao: DataHoraIso,
  usuarioRegistro: string,
  variacoes: VariacoesLote = {},
): Lote {
  const lancamentos = LANCAMENTOS_MOCK.filter((item) => item.loteId === id);

  return {
    id,
    instituicaoResponsavel: '0001',
    instituicao: '0002',
    dataEntrada,
    valorCentavos: lancamentos.reduce((total, item) => total + item.valorCentavos, 0),
    quantidadeLancamentos: lancamentos.length,
    usuarioRegistro,
    usuarioAprovacao: variacoes.usuarioAprovacao ?? null,
    situacao,
    dataHoraSituacao,
    justificativa: variacoes.justificativa ?? null,
  };
}

const APROVADOR = 'gearqc0310_00';

export const LOTES_MOCK: readonly Lote[] = [
  lote(1, '2026-04-24', 'CONFIRMADO', '2026-04-25T10:15:42', USUARIO_LOGADO, {
    usuarioAprovacao: APROVADOR,
  }),
  lote(2, '2026-04-26', 'ABERTO', '2026-04-27T12:35:11', USUARIO_LOGADO),
  lote(3, '2026-04-27', 'CONFIRMADO', '2026-04-29T09:02:17', 'gearqc0301_00', {
    usuarioAprovacao: APROVADOR,
  }),
  lote(4, '2026-04-28', 'ENVIADO', '2026-04-30T16:44:03', USUARIO_LOGADO),
  lote(5, '2026-04-29', 'ABERTO', '2026-04-29T11:20:55', 'gearqc0302_00', {
    justificativa: 'Lote devolvido para correção do histórico dos lançamentos.',
  }),
  lote(6, '2026-04-30', 'CONFIRMADO', '2026-05-04T14:05:31', 'gearqc0301_00', {
    usuarioAprovacao: 'gearqc0311_00',
  }),
  lote(7, '2026-05-04', 'ENVIADO', '2026-05-05T08:47:09', USUARIO_LOGADO, {
    justificativa: 'Valor acima do limite diário; aguardando aprovação da gerência.',
  }),
  lote(8, '2026-05-05', 'ABERTO', '2026-05-05T15:33:48', 'gearqc0302_00'),
  lote(9, '2026-05-06', 'CONFIRMADO', '2026-05-08T10:11:27', USUARIO_LOGADO, {
    usuarioAprovacao: APROVADOR,
  }),
  lote(10, '2026-05-07', 'ENVIADO', '2026-05-11T13:58:02', 'gearqc0301_00'),
  lote(11, '2026-05-08', 'ABERTO', '2026-05-08T09:26:14', USUARIO_LOGADO),
  lote(12, '2026-05-11', 'CONFIRMADO', '2026-05-13T17:03:55', 'gearqc0302_00', {
    usuarioAprovacao: 'gearqc0311_00',
  }),
  lote(13, '2026-05-12', 'ABERTO', '2026-05-12T10:40:36', 'gearqc0301_00', {
    justificativa: 'Documento de origem ilegível; reenviar o comprovante.',
  }),
  lote(14, '2026-05-13', 'ENVIADO', '2026-05-15T11:12:44', USUARIO_LOGADO),
  lote(15, '2026-05-14', 'ABERTO', '2026-05-14T16:05:19', 'gearqc0302_00'),
  lote(16, '2026-05-15', 'CONFIRMADO', '2026-05-19T09:30:00', 'gearqc0301_00', {
    usuarioAprovacao: APROVADOR,
  }),
  lote(17, '2026-05-18', 'ABERTO', '2026-05-18T14:22:37', USUARIO_LOGADO),
  lote(18, '2026-05-19', 'ENVIADO', '2026-05-20T15:48:21', 'gearqc0302_00'),
];
