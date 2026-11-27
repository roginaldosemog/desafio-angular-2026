# Regras de design

Inspiradas nas imagens de referência do enunciado. As medidas foram tiradas das capturas (tela de
1920 px de largura) e arredondadas para a escala de espaçamento. O objetivo é fidelidade de
estrutura e proporção, não pixel perfect.

## Tokens

| Uso                                          | Valor     | Token                           |
| -------------------------------------------- | --------- | ------------------------------- |
| Primária: botões, página ativa, De/Até, foco | `#007f78` | `--app-primary`                 |
| Títulos                                      | `#00665f` | `--app-title`                   |
| Cabeçalho de tabela, rótulos                 | `#002e37` | `--app-header`                  |
| Linhas de tabela, item ativo do menu         | `#effaf8` | `--app-highlight`               |
| Barra de ações                               | `#ebecf1` | `--app-barra-acoes` (novo)      |
| Botão secundário                             | `#f0f0f2` | `--app-botao-secundario` (novo) |
| Fundo da página                              | `#e8e8eb` | `--app-background`              |
| Bordas                                       | `#d6d6d6` | `--app-border`                  |

- **Espaçamento:** escala de 4 px: 4, 8, 12, 16, 24, 32 e 48.
- **Tipografia (Asap):** 11 px (auxiliar e erros), 12 px (base, rótulos, tabela, botões), 13 px
  (títulos de painel e seção), 14 px (título da página). Pesos 400, 600 e 700.
- **Raios:** 4 px (campos e botões), 6 px (painéis, seções e tabelas), 12 px (card), círculo
  (paginação).

## Estrutura da página

- **DS-01** Menu lateral de 72 px e cabeçalho de 64 px. O conteúdo fica num card branco com raio
  de 12 px, sombra leve, margem de 12 px e padding de 48 px.
- **DS-02** Dentro do card, de cima para baixo: painel de filtros, barra de ações e tabela com
  paginação, com 12 px entre eles.

## Filtros

- **DS-03** Painel com borda de 1 px, raio de 6 px e padding de 16 px. Cabeçalho com "Filtros"
  (13 px, peso 600), o subtítulo "PESQUISAR LOTE OUTROS CRÉDITOS/DÉBITOS" (12 px, caixa alta) e,
  à direita, o botão de recolher em forma de seta.
- **DS-04** Duas colunas iguais, com 32 px entre elas:
  - **Esquerda:** Instituição Resp., Instituição e Situação Lote, empilhados na largura toda.
  - **Direita:** uma linha por faixa, no formato `rótulo (96 px) | De | Até`. "De" e "Até" ficam
    acima de cada campo, na cor primária e com peso 600. ID e Valor têm até 160 px de largura; as
    datas ocupam o espaço da coluna.
- **DS-05** Pesquisar é um botão primário alinhado à direita, abaixo dos filtros.

## Campos

- **DS-06** Rótulo acima do campo (12 px, peso 600), a 4 px dele. Obrigatório marcado com `*` na
  cor de erro. Campo com 36 px de altura (a menor densidade do Material; a referência tem cerca de
  31 px), borda de 1 px e raio de 4 px.
- **DS-07** Foco: borda de 2 px na cor primária. Erro: borda e mensagem (11 px) na cor de erro,
  com a mensagem abaixo do campo.
- **DS-08** Somente leitura: texto mais claro e fundo levemente cinza. O campo continua focável e
  é lido pelo leitor de tela (`readonly`, não `disabled`).
- **DS-09** **Campo monetário** com preenchimento da direita para a esquerda: cada dígito entra
  pelos centavos (`1` → 0,01; `12` → 0,12; `123` → 1,23).
  - Backspace remove o último dígito, e o valor fica alinhado à direita.
  - Só aceita dígitos. Colar "1.234,56" resulta em 1.234,56.
  - No celular, abre o teclado numérico.
  - Limite de 999.999.999,99.
  - O valor guardado no formulário é um inteiro em centavos.
- **DS-10** Data: digitada no formato dd/mm/aaaa ou escolhida no calendário pelo ícone dentro do
  campo, à direita.
- **DS-11** ID Lote e Conta Corrente: só dígitos, com teclado numérico no celular.
- **DS-12** Busca por lupa (Conta Corrente, ID Evento): botão de ícone ao lado do campo, com rótulo
  acessível (por exemplo, "Buscar conta corrente"). O resultado (titular ou descrição do evento)
  aparece à direita, em 11 px. Enter no campo também busca.

## Botões

- **DS-13** Barra de ações: faixa cinza com raio de 6 px e padding de 4 px. Os botões ficam à
  esquerda, com 4 px entre eles.
  - Botões secundários: 28 px de altura, borda de 1 px e raio de 4 px, texto de 11 px em caixa
    alta com peso 600.
  - Incluir é a ação principal da barra e fica preenchido na cor primária.
- **DS-14** Estilos de botão:
  - **Primário:** fundo na cor primária e texto branco.
  - **Contorno** (Fechar): fundo branco, com borda e texto na cor primária.
  - **Desabilitado:** texto e borda acinzentados, sem efeito ao passar o mouse.

## Tabela

- **DS-15** Cabeçalho com 40 px de altura, fundo petróleo escuro e texto branco (12 px, peso 700).
  Linhas com 40 px, fundo verde-claro e divisória de 1 px. Passar o mouse e selecionar a linha
  realçam o fundo.
- **DS-16** Alinhamento: texto à esquerda; números e valores à direita, com algarismos de largura
  fixa (`tabular-nums`). A coluna da caixa de seleção tem 48 px.
- **DS-17** Em telas estreitas, a tabela rola na horizontal dentro do próprio contêiner. A página
  não rola de lado.
- **DS-18** Estados da tabela:
  - **Carregamento:** barra de progresso linear no topo, sem deslocar o layout.
  - **Erro:** aviso na área de resultados, com ícone, mensagem e "Tentar novamente".

## Paginação

- **DS-19** Centralizada, 16 px abaixo da tabela.
  - Botões circulares de 32 px, com 8 px entre eles.
  - Inativos: fundo cinza-claro e ícone escuro. Página atual: preenchida na cor primária, com o
    número em branco.
  - Rótulos acessíveis ("Primeira página", "Página 2") e `aria-current` na página atual.

## Modal

- **DS-20** Largura de 640 px e altura máxima de 90% da tela. Só o corpo rola:
  - **Topo fixo:** título em caixa alta (13 px, peso 700).
  - **Rodapé fixo:** "Manter dados na tela" à esquerda; INCLUIR (primário) e FECHAR (contorno) à
    direita.
- **DS-21** Seções como grupo com borda (`fieldset`): borda de 1 px, raio de 6 px, padding de 16 px
  e título (`legend`) de 13 px com peso 600. 16 px entre as seções.
- **DS-22** Larguras: Conta Corrente com 160 px; Valor e Documento com 200 px; Situação com 280 px.
  Histórico, PA, Descrição e Compl. Histórico ocupam a largura toda.
- **DS-23** Modal "Pesquisa Evento" com 600 px de largura:
  - linha de busca com Campo de Busca, Valor e o botão Listar;
  - tabela no mesmo estilo da consulta;
  - rodapé com OK (primário) e FECHAR (contorno).
- **DS-24** Mensagens de sucesso aparecem num aviso (snackbar) centralizado no rodapé da tela,
  como na referência, e são anunciadas ao leitor de tela.

## Responsividade

- **DS-25** Abaixo de 1024 px, os filtros ficam em uma coluna. Abaixo de 600 px:
  - menu lateral com 52 px e card com padding de 16 px;
  - a barra de ações quebra em mais de uma linha;
  - as faixas De/Até continuam lado a lado;
  - o modal ocupa a tela inteira, com todos os campos na largura toda.

## Acessibilidade

- **DS-26** Texto com contraste mínimo WCAG AA (4,5:1). Foco visível em todo elemento interativo.
  Área de clique mínima de 24 × 24 px.

## Diferenças intencionais em relação às imagens

- **Texto branco nos botões preenchidos.** Na referência, o texto é escuro sobre o verde, abaixo
  do contraste AA.
- **Rótulo sempre acima do campo.** A referência mistura rótulos à esquerda e acima no mesmo
  modal; padronizar facilita a leitura e a adaptação a telas menores.
- **Estorno como caixa de seleção**, como pede o enunciado. Na imagem, ele parece um botão de
  rádio.
- **Rodapé do modal fixo.** Na referência, os botões só aparecem depois de rolar até o fim.
- **Números alinhados à direita na tabela**, para facilitar a comparação de valores.
- **"R$" na coluna Valor**, como pede o enunciado ("formato monetário pt-BR"). A referência mostra
  só o número.
