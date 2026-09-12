# Barbearia

## Backend

```bash
cd BackEnd
npm install
```

Crie `BackEnd/.env` com:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/barbearia"
JWT_SECRET="uma-chave-secreta-forte"
BRUNAO_EMAIL="seu-email"
BRUNAO_PASSWORD="sua-senha-forte"
```

Depois:

```bash
npx prisma migrate dev
npx prisma generate
npm run seed
npm run dev
```

## Frontend

Em outro terminal:

```bash
cd frontend/frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

### Horários

No admin, o barbeiro cadastra **somente as horas** (por exemplo, `09:00`, `10:00`, `14:00`). Não é necessário cadastrar dia ou mês. No site, o cliente escolhe a data e depois um dos horários disponíveis.
