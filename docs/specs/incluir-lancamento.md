# Incluir Lançamento

Modal aberto sobre a [Consulta de Lotes](consulta-lotes.md) para incluir e manter os lançamentos
de um lote. Layout e comportamento visual em [design.md](design.md).

## Critérios de aceite

### Modal

- **IL-01** O modal abre sobre a consulta com o título "Incluir Lançamento" e o foco no primeiro
  campo. O Tab circula só dentro do modal. Esc e o botão Fechar fecham o modal, e o foco volta ao
  botão que o abriu.
- **IL-02** Os campos ficam agrupados nas seções "Conta Corrente", "Documento CSC" e "Anexo",
  cada uma com título.

### Seção Conta Corrente

- **IL-03** Conta Corrente é obrigatória. A lupa busca a conta: se encontrada, o nome do titular
  aparece ao lado; se não, o campo mostra "Conta corrente não encontrada".
- **IL-04** Valor é obrigatório e maior que zero, no campo monetário (DS-09).
- **IL-05** Histórico é obrigatório, escolhido numa lista (por exemplo, "Lançamento Manual").
- **IL-06** Estorno começa desmarcado. Documento é obrigatório. Descrição é opcional, com até
  200 caracteres. Situação é somente leitura e mostra "Pendente".

### Seção Documento CSC

- **IL-07** PA é obrigatório, escolhido numa lista.
- **IL-08** _(desejável)_ A lupa de ID Evento abre o modal "Pesquisa Evento": busca por ID,
  código ou descrição, lista os resultados e confirma a escolha com OK. O evento escolhido mostra
  a descrição ao lado do campo.
- **IL-09** _(desejável)_ Compl. Histórico é obrigatório. Situação é somente leitura e mostra
  "Aguardando Processamento CCO". ID Doc CSC é opcional.

### Seção Anexo

- **IL-10** _(desejável)_ Grade com Nome Reduzido do Arquivo, Descrição, Data Inclusão e
  ID Usuário. Incluir escolhe um arquivo e adiciona uma linha; Visualizar mostra os dados do anexo
  selecionado; Excluir remove o anexo selecionado. Sem anexos, a grade mostra
  "Nenhum registro encontrado.".

### Validação e inclusão

- **IL-11** Campos obrigatórios são marcados com \*. A mensagem de erro aparece abaixo do campo
  depois que ele é tocado ou depois de uma tentativa de inclusão, e é lida pelo leitor de tela
  junto com o campo.
- **IL-12** Incluir com o formulário inválido não inclui nada: todos os erros aparecem e o foco
  vai para o primeiro campo inválido.
- **IL-13** Incluir com o formulário válido adiciona o lançamento ao lote e ele aparece na grade
  de lançamentos. O formulário volta ao estado inicial, a menos que "Manter dados na tela" esteja
  marcado.
- **IL-17** Enquanto a conta corrente ou o ID do evento são verificados no servidor, o campo mostra
  "Verificando conta…" ou "Verificando evento…". Se a verificação falhar (servidor indisponível),
  o campo mostra "Não foi possível verificar a conta. Tente de novo." (ou "o evento"), Incluir não
  fica travado esperando, e a lupa ou o Enter verificam de novo.
- **IL-18** Campo de texto obrigatório preenchido só com espaços conta como vazio: mostra a mesma
  mensagem de obrigatório e não deixa incluir.

### Grade de lançamentos do lote

- **IL-14** A grade mostra Conta Corrente, Titular, Histórico, Valor, Documento e Situação.
  Visualizar, Alterar, Excluir e Duplicar só ficam habilitados com exatamente um lançamento
  selecionado.
- **IL-15** Visualizar carrega o lançamento no formulário sem permitir edição. Alterar carrega o
  lançamento para edição, e o botão principal passa a salvar a alteração. Duplicar carrega uma
  cópia como lançamento novo. Excluir pede confirmação e remove o lançamento. Em Alterar e
  Visualizar, um aviso acima do formulário indica o lançamento e permite voltar à inclusão.
- **IL-16** Ao fechar o modal, a consulta é atualizada: o lote aparece com a quantidade e o valor
  total dos lançamentos.

## Interpretações

- **Escopo do modal:** é o editor de lançamentos de um lote. Abre por Incluir (lote novo, com
  Data Entrada de hoje e situação Aberto) ou Alterar (lote Aberto existente) na consulta.
- **Grade dentro do modal:** na imagem 1, a grade de lançamentos fica numa tela de Lote atrás do
  modal. Como o enunciado pede o modal sobre a consulta e deixa outras telas fora do escopo, a
  grade foi trazida para dentro do modal.
- **Botão Incluir dos lançamentos:** é o INCLUIR do rodapé do modal, como na imagem de
  referência. A grade traz os demais botões.
- **Documento CSC simplificado:** o enunciado exige só o PA. ID Evento, Compl. Histórico e anexos
  estão marcados como _(desejável)_ e seguem as imagens de referência.
- **Anexos:** só os dados do arquivo (nome, data e usuário) ficam registrados; não há upload real.
