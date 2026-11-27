# Etapa 1: build da aplicação Angular, na mesma versão de Node do .nvmrc.
FROM node:24.15.0-alpine AS build
WORKDIR /app

# Dependências primeiro: a camada fica em cache enquanto o package-lock.json não mudar.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: só os arquivos estáticos, servidos pelo Nginx. A imagem final não tem Node nem fontes.
FROM nginx:stable-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/desafio-angular-2026/browser /usr/share/nginx/html
EXPOSE 80
