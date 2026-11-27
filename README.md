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
- **Campo monetário e máscara de data próprios**, sem biblioteca de máscara: o monetário é um
  `ControlValueAccessor` preenchido da direita para a esquerda, com valor em centavos.
- **Modelos imutáveis** (`readonly`), valores em centavos inteiros e datas no formato
  `AAAA-MM-DD` (tipo `DataIso`), sem fuso horário.
- **Rotas** com carregamento sob demanda (`loadChildren`). A tela fica em `/contabil`.
- **Padrão repositório:** os componentes dependem de `LotesApi` (contrato). A implementação
  simulada (`of` + `delay`) é fornecida na rota e pode ser trocada por HttpClient sem mexer nos
  componentes. Erro simulado com `/contabil?simularErro=true`.
- **Especificação primeiro (SDD):** critérios de aceite e regras de design em
  [docs/specs](docs/specs), citados no nome dos testes (`CL-01`, `IL-03`, `DS-09`...).
- **Testes com Vitest**, padrão do Angular 22, com API compatível com Jest.
- **ESLint** com regras de acessibilidade e **Prettier**.
- **CI no GitHub Actions:** formatação, lint, testes com cobertura e build a cada push e pull
  request.
