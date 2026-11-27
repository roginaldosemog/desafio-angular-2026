import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ContaCorrente, Historico, Instituicao, PontoAtendimento } from '../models/cadastros';
import { CadastrosApi } from './cadastros-api';
import {
  CONTAS_CORRENTES,
  HISTORICOS,
  INSTITUICOES,
  PONTOS_ATENDIMENTO,
} from './mock/cadastros.mock';
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
}
