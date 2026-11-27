# Desafio Prático Angular

## Execução

Requer Node.js 24.15+ ([.nvmrc](.nvmrc)).

```bash
npm install
npm start                    # http://localhost:4200
npx ng test --watch=false    # testes
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
- **Rotas** com carregamento sob demanda (`loadComponent`). A tela fica em `/contabil`.
- **Testes com Vitest**, padrão do Angular 22, com API compatível com Jest.
- **ESLint** com regras de acessibilidade e **Prettier**.
