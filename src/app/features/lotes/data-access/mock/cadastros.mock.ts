import {
  ContaCorrente,
  Evento,
  Historico,
  Instituicao,
  PontoAtendimento,
} from '../../models/cadastros';

/** Usuário fixo da aplicação: não há autenticação no escopo. */
export const USUARIO_LOGADO = 'gearqc0300_00';

export const INSTITUICOES: readonly Instituicao[] = [
  { codigo: '0001', nome: 'SICOOB' },
  { codigo: '0002', nome: 'SICOOB CENTRAL' },
];

export const CONTAS_CORRENTES: readonly ContaCorrente[] = [
  { numero: '44444', titular: 'Ana Paula Costa' },
  { numero: '10231', titular: 'Bruno Henrique Lima' },
  { numero: '20457', titular: 'Carla Mendes Rocha' },
  { numero: '30982', titular: 'Diego Almeida Santos' },
  { numero: '41126', titular: 'Eduarda Ferreira Nunes' },
  { numero: '52340', titular: 'Fábio Gonçalves Pires' },
];

export const HISTORICOS: readonly Historico[] = [
  { id: 1, descricao: 'Lançamento Manual' },
  { id: 2, descricao: 'Ajuste Contábil' },
  { id: 3, descricao: 'Tarifa Bancária' },
  { id: 4, descricao: 'Transferência entre Contas' },
];

export const PONTOS_ATENDIMENTO: readonly PontoAtendimento[] = [
  { id: 1, nome: 'Cooperativa' },
  { id: 2, nome: 'PA 01 - Asa Sul' },
  { id: 3, nome: 'PA 02 - Taguatinga' },
];

/** Descrições sem acento, como no sistema de origem (imagem de referência). */
export const EVENTOS: readonly Evento[] = [
  {
    id: 102,
    codigo: 300,
    descricao: 'Centralizacao Titulo CSC Credito',
    dataInicio: '2019-12-31',
    dataFim: null,
  },
  {
    id: 103,
    codigo: 301,
    descricao: 'Centralizacao Titulo CSC Debito',
    dataInicio: '2019-12-31',
    dataFim: null,
  },
  {
    id: 110,
    codigo: 350,
    descricao: 'Tarifa Servico CSC',
    dataInicio: '2021-03-01',
    dataFim: null,
  },
  {
    id: 115,
    codigo: 410,
    descricao: 'Ajuste Saldo CSC',
    dataInicio: '2020-01-15',
    dataFim: '2025-12-31',
  },
];
