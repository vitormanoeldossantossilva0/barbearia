# Barbearia — Full Stack

Sistema de agendamento online para barbearia, com painel de gestão, serviços por barbeiro, horários recorrentes, agendamentos, WhatsApp e autenticação.

## Stack

- Backend: Node.js, Express, TypeScript, Prisma 7 e PostgreSQL
- Frontend: React, TypeScript, Vite, Tailwind CSS e React Router
- Deploy: Render

## Desenvolvimento local

### Backend

```bash
cd BackEnd
npm install
```

Crie `BackEnd/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barbearia"
JWT_SECRET="uma-chave-longa-e-aleatoria"
BRUNAO_EMAIL="seu-email"
BRUNAO_PASSWORD="uma-senha-com-8-ou-mais-caracteres"
RESET_PASSWORD_CODE="um-codigo-mestre-longo-e-secreto"
```

Depois:

```bash
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev
```

### Frontend

Em outro terminal:

```bash
cd frontend/frontend
npm install
npm run dev
```

## Regras importantes

- O cliente não cria conta.
- O barbeiro cadastra horários recorrentes, como `09:00`, `10:00` e `14:00`; o cliente escolhe a data.
- Serviços pertencem ao barbeiro e seus preços são próprios.
- Serviços podem ser organizados em tópicos criados pelo administrador; cada tópico aparece na Home e reúne seus serviços. Combos continuam usando serviços do próprio barbeiro e têm preço próprio.
- Agendamentos e dados dos clientes são protegidos por autenticação no painel.
- O banco possui uma restrição única para impedir duas reservas do mesmo barbeiro na mesma data e horário.
- Horários já reservados continuam visíveis para o cliente, mas ficam desabilitados como “Indisponível”.
- O primeiro usuário criado pelo seed é administrador. Novos barbeiros criados pelo administrador recebem o papel `BARBER`.
- O WhatsApp e as redes sociais (Instagram, Facebook e TikTok) são opcionais. Quando configurados, aparecem somente nos locais públicos correspondentes.
- O reset de senha por código mestre é um mecanismo de contingência do MVP; em uma operação maior, o ideal é substituir por recuperação com e-mail/token.

## Render

### Backend — Web Service

Root Directory:

```text
BackEnd
```

Build Command:

```bash
npm install && npx prisma generate
```

Start Command:

```bash
npx prisma migrate deploy && npm run seed && npx tsx src/server.ts
```

### Frontend — Static Site

Root Directory:

```text
frontend/frontend
```

Build Command:

```bash
npm install && npm run build
```

A configuração de SPA em `render.yaml` mantém as rotas do React funcionando diretamente no Render.

## Validação antes do deploy

Frontend:

```bash
cd frontend/frontend
npm install
npm run build
npm run lint
```

Backend:

```bash
cd BackEnd
npm install
npx prisma generate
npx tsc --noEmit
```


## Painel Master

O sistema suporta várias barbearias no mesmo projeto e banco, com isolamento por barbearia.

1. Configure `MASTER_EMAIL` e `MASTER_PASSWORD` no `.env` do backend.
2. Rode `npm run seed` para criar/atualizar a conta Master.
3. Acesse `/master/login` para entrar no painel Master.
4. Em `/master/barbearias`, crie a nova barbearia. O sistema cria a conta administrativa do responsável e a vincula à nova barbearia.
5. Cada responsável acessa o próprio painel em `/{slug}/admin`.
6. O site público de cada cliente fica em `/{slug}`.

As imagens da barbearia e dos barbeiros são redimensionadas no navegador e armazenadas como dados da própria entidade para manter a implementação simples nesta etapa.
