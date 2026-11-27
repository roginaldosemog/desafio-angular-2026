import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Lote } from '../../models/lote';
import { AcaoLote } from '../../regras/acoes-lote';
import { criarLote } from '../../testing/fabricas';
import { BarraAcoes } from './barra-acoes';

describe('BarraAcoes', () => {
  let fixture: ComponentFixture<BarraAcoes>;
  let pedidas: AcaoLote[];

  async function criar(selecionados: readonly Lote[], ocupada = false) {
    TestBed.configureTestingModule({ imports: [BarraAcoes] });
    fixture = TestBed.createComponent(BarraAcoes);
    fixture.componentRef.setInput('selecionados', selecionados);
    fixture.componentRef.setInput('ocupada', ocupada);
    pedidas = [];
    fixture.componentInstance.acao.subscribe((acao) => pedidas.push(acao));
    await fixture.whenStable();
  }

  const botoes = (): HTMLButtonElement[] => [...fixture.nativeElement.querySelectorAll('button')];
  const botao = (texto: string) => {
    const encontrado = botoes().find((item) => item.textContent?.trim() === texto);
    if (!encontrado) {
      throw new Error(`Botão "${texto}" não encontrado.`);
    }
    return encontrado;
  };
  const habilitados = () =>
    botoes()
      .filter((item) => !item.disabled)
      .map((item) => item.textContent?.trim());

  it('mostra as ações na ordem da referência, num grupo com nome acessível', async () => {
    await criar([]);

    expect(botoes().map((item) => item.textContent?.trim())).toEqual([
      'Confirmar',
      'Enviar',
      'Visualizar Justificativa',
      'Incluir',
      'Alterar',
      'Excluir',
      'Visualizar',
    ]);
    const grupo = fixture.nativeElement.querySelector('[role=group]');
    expect(grupo?.getAttribute('aria-label')).toBe('Ações dos lotes');
  });

  it('CL-14: habilita só o que a seleção permite', async () => {
    await criar([criarLote({ situacao: 'ABERTO', justificativa: null })]);

    expect(habilitados()).toEqual(['Enviar', 'Incluir', 'Alterar', 'Excluir', 'Visualizar']);
  });

  it('avisa qual ação foi pedida', async () => {
    await criar([criarLote({ situacao: 'ENVIADO' })]);

    botao('Confirmar').click();
    botao('Visualizar').click();

    expect(pedidas).toEqual(['confirmar', 'visualizar']);
  });

  it('desabilita tudo enquanto uma ação está em andamento, para não repetir o pedido', async () => {
    await criar([criarLote({ situacao: 'ABERTO' })], true);

    expect(habilitados()).toEqual([]);
  });

  it('DS-13: Incluir é a ação principal da barra', async () => {
    await criar([]);

    expect(botao('Incluir').classList).toContain('principal');
  });
});
