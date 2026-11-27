import { FormControl } from '@angular/forms';
import { firstValueFrom, Observable, of } from 'rxjs';
import { ContaCorrente } from '../models/cadastros';
import { contaCorrenteExistente } from './conta-corrente-existente';

const CONTA: ContaCorrente = { numero: '44444', titular: 'Ana Paula Costa' };

describe('contaCorrenteExistente', () => {
  let buscadas: string[];
  let encontradas: (ContaCorrente | null)[];

  const buscar = (numero: string): Observable<ContaCorrente | null> => {
    buscadas.push(numero);
    return of(numero === CONTA.numero ? CONTA : null);
  };

  function validar(numero: string) {
    const validador = contaCorrenteExistente(buscar, (conta) => encontradas.push(conta));
    return firstValueFrom(validador(new FormControl(numero)) as Observable<unknown>);
  }

  beforeEach(() => {
    buscadas = [];
    encontradas = [];
  });

  it('IL-03: conta existente é válida e informa o titular encontrado', async () => {
    expect(await validar('44444')).toBeNull();
    expect(encontradas).toEqual([CONTA]);
  });

  it('IL-03: conta inexistente gera o erro "contaNaoEncontrada"', async () => {
    expect(await validar('99999')).toEqual({ contaNaoEncontrada: true });
    expect(encontradas).toEqual([null]);
  });

  it('campo vazio não consulta o serviço: o required cuida dele', async () => {
    expect(await validar('')).toBeNull();
    expect(buscadas).toEqual([]);
    expect(encontradas).toEqual([null]);
  });
});
