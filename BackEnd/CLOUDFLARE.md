# Cloudflare Workers — backend

Esta versão mantém o backend Express/Prisma existente e adiciona uma entrada específica para Cloudflare Workers.

## O que mudou

- `src/app.ts`: concentra o Express e as rotas, sem abrir uma porta.
- `src/server.ts`: continua sendo o servidor Node tradicional para desenvolvimento/Render.
- `src/worker.ts`: entrada do Cloudflare Workers usando `httpServerHandler`.
- `wrangler.jsonc`: configuração do Worker com compatibilidade Node.
- `bcrypt` foi substituído por `bcryptjs`, que é JavaScript puro e mantém compatibilidade com os hashes bcrypt existentes.
- `src/lib/prisma.ts` deixou de carregar `dotenv` diretamente; no Node o `server.ts` continua carregando `.env`, enquanto no Workers as variáveis são fornecidas pelo Cloudflare.
- Nenhuma migration ou alteração de banco foi adicionada.

## Cloudflare

Configure o diretório do projeto como `BackEnd`.

Build command:

```text
npm install
```

Deploy command:

```text
npx wrangler deploy
```

Configure como secrets/variables do Worker, sem colocar os valores no Git:

- `DATABASE_URL`
- `JWT_SECRET`
- `RESET_PASSWORD_CODE`

Se o recurso de redefinição de senha for usado, `RESET_PASSWORD_CODE` também precisa estar configurado.

## Desenvolvimento local

O desenvolvimento Node existente continua:

```text
npm install
npm run dev
```

Para testar o Worker localmente:

```text
npm install
npx wrangler dev
```

Não execute `prisma migrate reset`, `prisma db push` ou qualquer operação destrutiva durante esta migração.
