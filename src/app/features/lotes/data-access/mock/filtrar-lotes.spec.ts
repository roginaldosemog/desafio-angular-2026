import { criarFiltros, criarLote } from '../../testing/fabricas';
import { filtrarLotes } from './filtrar-lotes';

describe('filtrarLotes', () => {
  const ids = (lotes: readonly { id: number }[]) => lotes.map((lote) => lote.id);

  it('CL-06: sem restrições, devolve todos os lotes das instituições informadas', () => {
    const lotes = [
      criarLote({ id: 1 }),
      criarLote({ id: 2 }),
      criarLote({ id: 3, instituicao: '0009' }),
    ];

    expect(ids(filtrarLotes(lotes, criarFiltros()))).toEqual([1, 2]);
  });

  it('CL-04: filtra pela instituição responsável', () => {
    const lotes = [criarLote({ id: 1 }), criarLote({ id: 2, instituicaoResponsavel: '0009' })];

    expect(ids(filtrarLotes(lotes, criarFiltros()))).toEqual([1]);
  });

  it('CL-04: filtra pela situação; "Todas" (null) não restringe', () => {
    const lotes = [
      criarLote({ id: 1, situacao: 'ABERTO' }),
      criarLote({ id: 2, situacao: 'ENVIADO' }),
      criarLote({ id: 3, situacao: 'CONFIRMADO' }),
    ];

    expect(ids(filtrarLotes(lotes, criarFiltros({ situacao: 'ENVIADO' })))).toEqual([2]);
    expect(ids(filtrarLotes(lotes, criarFiltros({ situacao: null })))).toEqual([1, 2, 3]);
  });

  it('CL-04: filtra pela faixa de ID, incluindo os limites', () => {
    const lotes = [1, 2, 3, 4, 5].map((id) => criarLote({ id }));

    const filtros = criarFiltros({ idLote: { de: 2, ate: 4 } });

    expect(ids(filtrarLotes(lotes, filtros))).toEqual([2, 3, 4]);
  });

  it('CL-04: aceita faixa aberta, só com De ou só com Até', () => {
    const lotes = [1, 2, 3].map((id) => criarLote({ id }));

    const soDe = criarFiltros({ idLote: { de: 2, ate: null } });
    const soAte = criarFiltros({ idLote: { de: null, ate: 2 } });

    expect(ids(filtrarLotes(lotes, soDe))).toEqual([2, 3]);
    expect(ids(filtrarLotes(lotes, soAte))).toEqual([1, 2]);
  });

  it('CL-04: filtra pela faixa de valor em centavos', () => {
    const lotes = [
      criarLote({ id: 1, valorCentavos: 999 }),
      criarLote({ id: 2, valorCentavos: 1000 }),
      criarLote({ id: 3, valorCentavos: 5000 }),
      criarLote({ id: 4, valorCentavos: 5001 }),
    ];
    const filtros = criarFiltros({ valorCentavos: { de: 1000, ate: 5000 } });

    expect(ids(filtrarLotes(lotes, filtros))).toEqual([2, 3]);
  });

  it('CL-04: filtra pela faixa de data de entrada', () => {
    const lotes = [
      criarLote({ id: 1, dataEntrada: '2026-04-30' }),
      criarLote({ id: 2, dataEntrada: '2026-05-01' }),
      criarLote({ id: 3, dataEntrada: '2026-05-31' }),
      criarLote({ id: 4, dataEntrada: '2026-06-01' }),
    ];
    const filtros = criarFiltros({ dataEntrada: { de: '2026-05-01', ate: '2026-05-31' } });

    expect(ids(filtrarLotes(lotes, filtros))).toEqual([2, 3]);
  });

  it('CL-06: combina todos os filtros informados', () => {
    const lotes = [
      criarLote({ id: 1, situacao: 'ABERTO', valorCentavos: 5000 }),
      criarLote({ id: 2, situacao: 'ABERTO', valorCentavos: 50 }),
      criarLote({ id: 3, situacao: 'ENVIADO', valorCentavos: 5000 }),
    ];
    const filtros = criarFiltros({ situacao: 'ABERTO', valorCentavos: { de: 1000, ate: null } });

    expect(ids(filtrarLotes(lotes, filtros))).toEqual([1]);
  });
});
