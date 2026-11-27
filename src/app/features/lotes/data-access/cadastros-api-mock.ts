import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Instituicao } from '../models/cadastros';
import { CadastrosApi } from './cadastros-api';
import { INSTITUICOES } from './mock/cadastros.mock';
import { ServidorSimulado } from './mock/servidor-simulado';

@Injectable()
export class CadastrosApiMock implements CadastrosApi {
  private readonly servidor = inject(ServidorSimulado);

  listarInstituicoes(): Observable<readonly Instituicao[]> {
    return this.servidor.responder(() => INSTITUICOES);
  }
}
