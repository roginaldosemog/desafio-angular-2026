# Consulta de Lotes

Tela principal do módulo Outros Créditos/Débitos: pesquisa, seleção e ações sobre lotes. Layout e
comportamento visual em [design.md](design.md).

## Critérios de aceite

### Navegação e layout

- **CL-01** A tela fica em `/contabil`. A raiz e endereços desconhecidos redirecionam para ela.
  A aba do navegador mostra "Consulta de Lotes · Outros Créditos/Débitos".
- **CL-02** O cabeçalho mostra o título "Outros Créditos/Débitos" e o breadcrumb
  "Início › Outros Créditos/Débitos". O item "Contábil" do menu lateral aparece como página atual.

### Filtros

- **CL-03** O painel de filtros começa aberto e pode ser recolhido e expandido.
- **CL-04** Campos: Instituição Resp. (somente leitura, "0001 - SICOOB"), Instituição (lista,
  padrão "0002 - SICOOB CENTRAL"), Situação Lote (Todas, Aberto, Enviado, Confirmado; padrão Todas),
  ID Lote De/Até, Valor Lote De/Até e Data Entrada De/Até com seletor de data.
- **CL-05** Em cada faixa, "De" não pode ser maior que "Até". ID Lote aceita inteiros a partir
  de 1 e Valor Lote usa o campo monetário (DS-09). Com filtro inválido, o erro aparece no campo
  e a pesquisa não é feita.

### Pesquisa

- **CL-06** Ao abrir a tela, a pesquisa é feita com os filtros padrão. O botão Pesquisar
  consulta com os filtros informados.
- **CL-07** Ao alterar um filtro, se todos os filtros forem válidos, a pesquisa é refeita
  automaticamente 400 ms depois da última alteração (debounce). Se uma pesquisa nova começa antes
  da anterior terminar, a resposta antiga é descartada.
- **CL-08** Durante a pesquisa, um indicador de carregamento fica visível e é anunciado a
  leitores de tela.
- **CL-09** Se a pesquisa falha, ela é tentada mais uma vez automaticamente. Se falhar de novo, a
  tela mostra uma mensagem de erro e o botão "Tentar novamente". A falha da pesquisa pode ser
  simulada abrindo a tela com `?simularErro=true`; as listas de apoio (instituições) não são
  afetadas.

### Tabela

- **CL-10** Colunas: ID Lote, Data Entrada, Valor, Quant. Lançamentos, Usuário Registro,
  Usuário Aprovação, Situação Lote e Data/Hora Situação Lote. Valor em reais no formato pt-BR
  (R$ 5.000,00), datas em dd/mm/aaaa e data/hora em dd/mm/aaaa, hh:mm:ss, como na referência.
- **CL-11** Quando a pesquisa termina sem resultados, a tabela mostra "Nenhum registro
  encontrado.". Enquanto a pesquisa carrega, mostra "Pesquisando lotes…".
- **CL-12** Cada linha tem uma caixa de seleção. A caixa do cabeçalho seleciona ou desmarca
  todos os lotes da página e indica seleção parcial. Trocar de página ou pesquisar limpa a seleção.
- **CL-13** Paginação com 10 lotes por página: primeira, anterior, números das páginas, próxima e
  última. A página atual fica destacada. Os botões sem destino possível ficam desabilitados.

### Ações

- **CL-14** Alterar, Excluir e Visualizar só ficam habilitados com exatamente um lote selecionado.
- **CL-15** Incluir abre o modal [Incluir Lançamento](incluir-lancamento.md) para um lote novo.
- **CL-16** Alterar abre o modal Incluir Lançamento com os lançamentos do lote. Só vale para lote
  Aberto.
- **CL-17** Excluir pede confirmação e remove o lote. Só vale para lote Aberto.
- **CL-18** Visualizar mostra os dados e os lançamentos do lote, sem permitir edição.
- **CL-19** Enviar muda os lotes selecionados de Aberto para Enviado. Exige ao menos um lote
  selecionado, e todos Aberto.
- **CL-20** Confirmar muda os lotes selecionados de Enviado para Confirmado e registra o usuário
  de aprovação. Exige ao menos um lote selecionado, e todos Enviado.
- **CL-21** Visualizar Justificativa mostra o texto da justificativa. Exige exatamente um lote
  selecionado, com justificativa.
- **CL-22** Depois de uma ação concluída, a pesquisa é refeita com os mesmos filtros e uma
  mensagem confirma o resultado. A Data/Hora Situação Lote registra o momento da mudança.

## Interpretações

O enunciado não define estes pontos; a escolha está registrada aqui.

- **Ciclo do lote:** Aberto → Enviado → Confirmado. Daí vêm as regras por situação em CL-16,
  CL-17, CL-19 e CL-20. O enunciado só exige "exatamente um selecionado" para Alterar, Excluir e
  Visualizar.
- **Debounce:** aplicado à pesquisa automática ao alterar filtros. O botão Pesquisar consulta na
  hora.
- **Seleção:** vale só para a página atual, para o usuário não agir sobre lotes que não está vendo.
- **Erro simulado:** pela URL, para poder ser demonstrado sem alterar código.

## Fora do escopo

- Persistência: os dados ficam em memória e voltam ao estado inicial ao recarregar a página.
- Autenticação: o usuário logado é fixo.
