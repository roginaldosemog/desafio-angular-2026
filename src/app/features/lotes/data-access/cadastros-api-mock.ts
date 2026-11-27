import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pagina } from '../../../shared/models/pagina';
import {
  CampoBuscaEvento,
  ContaCorrente,
  Evento,
  Historico,
  Instituicao,
  PontoAtendimento,
} from '../models/cadastros';
import { CadastrosApi } from './cadastros-api';
import {
  CONTAS_CORRENTES,
  EVENTOS,
  HISTORICOS,
  INSTITUICOES,
  PONTOS_ATENDIMENTO,
} from './mock/cadastros.mock';
import { paginar } from './mock/paginar';
import { ServidorSimulado } from './mock/servidor-simulado';

@Injectable()
export class CadastrosApiMock implements CadastrosApi {
  private readonly servidor = inject(ServidorSimulado);

  listarInstituicoes(): Observable<readonly Instituicao[]> {
    return this.servidor.responder(() => INSTITUICOES, { podeFalhar: false });
  }

  buscarContaCorrente(numero: string): Observable<ContaCorrente | null> {
    return this.servidor.responder(
      () => CONTAS_CORRENTES.find((conta) => conta.numero === numero) ?? null,
      { podeFalhar: false },
    );
  }

  listarHistoricos(): Observable<readonly Historico[]> {
    return this.servidor.responder(() => HISTORICOS, { podeFalhar: false });
  }

  listarPontosAtendimento(): Observable<readonly PontoAtendimento[]> {
    return this.servidor.responder(() => PONTOS_ATENDIMENTO, { podeFalhar: false });
  }

  buscarEvento(id: number): Observable<Evento | null> {
    return this.servidor.responder(() => EVENTOS.find((evento) => evento.id === id) ?? null, {
      podeFalhar: false,
    });
  }

  pesquisarEventos(
    campo: CampoBuscaEvento,
    valor: string,
    pagina: number,
    tamanhoPagina: number,
  ): Observable<Pagina<Evento>> {
    return this.servidor.responder(
      () => paginar(EVENTOS.filter(atendeBusca(campo, valor.trim())), pagina, tamanhoPagina),
      { podeFalhar: false },
    );
  }
}

/** ID e código pelo valor exato; descrição por trecho, sem diferenciar maiúsculas. */
function atendeBusca(campo: CampoBuscaEvento, valor: string): (evento: Evento) => boolean {
  if (valor === '') {
    return () => true;
  }
  switch (campo) {
    case 'id':
      return (evento) => String(evento.id) === valor;
    case 'codigo':
      return (evento) => String(evento.codigo) === valor;
    case 'descricao':
      return (evento) => evento.descricao.toLowerCase().includes(valor.toLowerCase());
  }
}
