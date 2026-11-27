import { criarLote } from '../testing/fabricas';
import { acoesHabilitadas } from './acoes-lote';

describe('acoesHabilitadas', () => {
  const aberto = (id: number) => criarLote({ id, situacao: 'ABERTO' });
  const enviado = (id: number) => criarLote({ id, situacao: 'ENVIADO' });
  const confirmado = (id: number) => criarLote({ id, situacao: 'CONFIRMADO' });

  it('CL-15: Incluir está sempre disponível, mesmo sem seleção', () => {
    expect(acoesHabilitadas([]).incluir).toBe(true);
    expect(acoesHabilitadas([aberto(1), enviado(2)]).incluir).toBe(true);
  });

  it('CL-14: sem seleção, só Incluir fica habilitado', () => {
    expect(acoesHabilitadas([])).toEqual({
      confirmar: false,
      enviar: false,
      justificativa: false,
      incluir: true,
      alterar: false,
      excluir: false,
      visualizar: false,
    });
  });

  it('CL-14: Visualizar exige exatamente um lote, em qualquer situação', () => {
    expect(acoesHabilitadas([confirmado(1)]).visualizar).toBe(true);
    expect(acoesHabilitadas([aberto(1), aberto(2)]).visualizar).toBe(false);
  });

  it('CL-14, CL-16, CL-17: Alterar e Excluir exigem exatamente um lote, e Aberto', () => {
    expect(acoesHabilitadas([aberto(1)])).toMatchObject({ alterar: true, excluir: true });
    expect(acoesHabilitadas([enviado(1)])).toMatchObject({ alterar: false, excluir: false });
    expect(acoesHabilitadas([aberto(1), aberto(2)])).toMatchObject({
      alterar: false,
      excluir: false,
    });
  });

  it('CL-19: Enviar exige ao menos um lote, todos Aberto', () => {
    expect(acoesHabilitadas([aberto(1), aberto(2)]).enviar).toBe(true);
    expect(acoesHabilitadas([aberto(1), enviado(2)]).enviar).toBe(false);
  });

  it('CL-20: Confirmar exige ao menos um lote, todos Enviado', () => {
    expect(acoesHabilitadas([enviado(1), enviado(2)]).confirmar).toBe(true);
    expect(acoesHabilitadas([enviado(1), confirmado(2)]).confirmar).toBe(false);
  });

  it('CL-21: Visualizar Justificativa exige exatamente um lote, com justificativa', () => {
    const comTexto = criarLote({ justificativa: 'Reenviar o comprovante.' });

    expect(acoesHabilitadas([comTexto]).justificativa).toBe(true);
    expect(acoesHabilitadas([criarLote({ justificativa: null })]).justificativa).toBe(false);
    expect(acoesHabilitadas([comTexto, comTexto]).justificativa).toBe(false);
  });
});
