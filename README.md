# Desafio Prático Angular

## Execução

Requer Node.js 24.15+ ([.nvmrc](.nvmrc)).

```bash
npm install
npm start                    # http://localhost:4200
npm run test:ci              # testes com cobertura
npm run lint
npm run build
```

## Versões

Angular 22.3 · Angular Material 22.3 · TypeScript 6.0 · RxJS 7.8 · Vitest 5.1

## Decisões técnicas

- **Angular 22** standalone e zoneless. `OnPush`, `strict` e `strictTemplates` já são o padrão
  da versão.
- **Angular Material** com tema gerado a partir de `#007f78` e design tokens (`--app-*`) em
  [styles.scss](src/styles.scss).
- **Fonte Asap e ícones Material Symbols** servidos localmente, sem CDN.
- **Reactive Forms tipados**, com validadores nativos e um validador de faixa De/Até próprio,
  reaproveitado em ID, Valor e Data.
- **Datas em dd/mm/aaaa:** adaptador próprio, porque o nativo do Material lê no formato americano.
- **Modal de lançamento** com Reactive Forms tipado: validadores nativos, um customizado
  (`valorPositivo`) e um assíncrono genérico (`existeNoCadastro`, para conta e evento, validado ao sair do
  campo). Aberto
  pelo `MatDialog` com o injetor da página, para usar as APIs da rota. O mesmo modal inclui, altera,
  duplica e exclui lançamentos, e abre somente leitura no Visualizar (modo como união discriminada).
- **Campo monetário e máscara de data próprios**, sem biblioteca de máscara: o monetário é um
  `ControlValueAccessor` preenchido da direita para a esquerda, com valor em centavos.
- **Estado com signals:** a página guarda filtros, página e seleção em signals. A pesquisa usa
  `rxResource` (estável no Angular 22), que descarta a resposta anterior; a seleção da tabela é
  um `model()`.
- **Paginação própria** com número de página, porque o `MatPaginator` não mostra os números. Na
  troca de página, um `linkedSignal` mantém a página anterior na tela até a nova chegar.
- **Ações dos lotes:** as regras de habilitação ficam numa função pura (`acoesHabilitadas`),
  testada sem tela; a API simulada valida de novo a situação dos lotes, como um servidor faria.
  Diálogos com `MatDialog` (foco preso, Esc, foco devolvido) e avisos com `MatSnackBar`.
- **Pipes pt-BR:** `date`, `reais` (centavos → R$) e `rotuloSituacao`.
- **Modelos imutáveis** (`readonly`), valores em centavos inteiros e datas no formato
  `AAAA-MM-DD` (tipo `DataIso`), sem fuso horário.
- **Rotas** com carregamento sob demanda (`loadChildren`). A tela fica em `/contabil`.
- **Padrão repositório:** os componentes dependem de `LotesApi` (contrato). A implementação
  simulada (`of` + `delay`) é fornecida na rota e pode ser trocada por HttpClient sem mexer nos
  componentes.
- **Pesquisa:** automática 400 ms depois da última alteração de filtro (`debounceTime`), imediata
  no botão Pesquisar, com indicador de carregamento e uma nova tentativa automática (`retry`)
  antes de mostrar o erro. Para ver o erro: `/contabil?simularErro=true`.
- **Especificação primeiro (SDD):** critérios de aceite e regras de design em
  [docs/specs](docs/specs), citados no nome dos testes (`CL-01`, `IL-03`, `DS-09`...).
- **Testes com Vitest**, padrão do Angular 22, com API compatível com Jest.
- **ESLint** com regras de acessibilidade e **Prettier**.
- **CI no GitHub Actions:** formatação, lint, testes com cobertura e build a cada push e pull
  request.
