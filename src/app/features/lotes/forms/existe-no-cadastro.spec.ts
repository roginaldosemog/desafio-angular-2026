import { FormControl } from '@angular/forms';
import { firstValueFrom, Observable, of, throwError } from 'rxjs';
import { ContaCorrente } from '../models/cadastros';
import { ERRO_VERIFICACAO, existeNoCadastro } from './existe-no-cadastro';

const CONTA: ContaCorrente = { numero: '44444', titular: 'Ana Paula Costa' };

describe('existeNoCadastro', () => {
  let buscados: string[];
  let encontrados: (ContaCorrente | null)[];

  const buscar = (codigo: string): Observable<ContaCorrente | null> => {
    buscados.push(codigo);
    return of(codigo === CONTA.numero ? CONTA : null);
  };

  function validar(codigo: string) {
    const validador = existeNoCadastro(
      buscar,
      (conta) => encontrados.push(conta),
      'contaNaoEncontrada',
    );
    return firstValueFrom(validador(new FormControl(codigo)) as Observable<unknown>);
  }

  beforeEach(() => {
    buscados = [];
    encontrados = [];
  });

  it('IL-03, IL-08: registro existente é válido e é informado a quem chamou', async () => {
    expect(await validar('44444')).toBeNull();
    expect(encontrados).toEqual([CONTA]);
  });

  it('IL-03, IL-08: registro inexistente gera o erro informado', async () => {
    expect(await validar('99999')).toEqual({ contaNaoEncontrada: true });
    expect(encontrados).toEqual([null]);
  });

  it('IL-17: falha na consulta vira erro de verificação, em vez de deixar o campo pendente', async () => {
    const validador = existeNoCadastro<ContaCorrente>(
      () => throwError(() => new Error('Servidor indisponível')),
      (conta) => encontrados.push(conta),
      'contaNaoEncontrada',
    );

    const erros = await firstValueFrom(validador(new FormControl('44444')) as Observable<unknown>);

    expect(erros).toEqual({ [ERRO_VERIFICACAO]: true });
    expect(encontrados).toEqual([null]);
  });

  it('campo vazio não consulta o serviço: obrigatoriedade é papel do required', async () => {
    expect(await validar('')).toBeNull();
    expect(buscados).toEqual([]);
    expect(encontrados).toEqual([null]);
  });
});
