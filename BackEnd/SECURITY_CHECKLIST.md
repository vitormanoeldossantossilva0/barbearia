# Checklist de segurança antes da publicação

## O que já foi endurecido no código

- JWT só aceita o algoritmo HS256.
- Tokens inválidos, expirados, excessivamente grandes ou com claims inconsistentes são rejeitados.
- Contas ADMIN/BARBER precisam carregar `barberId` e `barbershopId` válidos no token.
- Contas MASTER não podem carregar vínculos de barbeiro/barbearia no token.
- Rotas de agenda e agendamentos internos exigem uma conta ADMIN/BARBER vinculada a uma barbearia.
- Consultas públicas de barbeiros, serviços e horários não fazem mais enumeração global sem escopo.
- Horários públicos confirmam que o barbeiro pertence à barbearia informada.
- Serviços continuam limitados ao barbeiro autenticado nas operações de criação/edição/exclusão.
- Tópicos continuam limitados à barbearia do usuário.
- Agendamentos públicos validam barbeiro, serviços e horários no servidor; o preço gravado vem do banco, não do cliente.
- Limite de tamanho para JSON/URL-encoded requests.
- Cabeçalhos básicos de segurança HTTP.
- `X-Powered-By` desativado.
- URLs de imagem aceitam somente HTTP/HTTPS nas operações administrativas.
- `JWT_SECRET` e `DATABASE_URL` não ficam no código.
- Arquivo `.env-backup` removido do projeto e ignorado pelo Git.
- Senhas continuam sendo armazenadas com bcrypt.
- Criação e atualização de contas usam bcrypt com custo 12.
- Login e redefinição não expõem detalhes que permitam descobrir se um e-mail existe.

## Secrets obrigatórios no Cloudflare

Configure como Secrets, nunca no Git:

- `DATABASE_URL`
- `JWT_SECRET`
- `RESET_PASSWORD_CODE` (se a redefinição por código continuar habilitada)

Configure `CORS_ORIGINS` como variável/secret com os domínios reais do frontend separados por vírgula quando o endereço de produção estiver definido.

## Importante

Nenhuma aplicação web pode ser declarada “100% invulnerável”. Esta versão reduz os problemas de autenticação, autorização, exposição entre barbearias, entrada de dados e configuração de produção encontrados nesta auditoria.

Para produção, também é recomendável configurar rate limiting na borda do Cloudflare para `/auth/login`, `/auth/reset-password` e, se necessário, `/appointments`. O Free do Cloudflare possui uma regra de rate limiting por zona; a configuração é feita no painel da zona/domínio.
