# HemoVida - MS4 Usuarios

Microsservico de identidade e login centralizado do HemoVida.
Perfis: `ADMIN`, `RECEPCAO`, `ENFERMAGEM`, `GESTOR_ESTOQUE`, `GESTOR_DEMANDA`, `DOADOR`.

## Rodando (Node 24, veja `.nvmrc`)

1. `npm install`
2. Rode `database/hemovida-usuarios.sql` UMA vez no banco `20262M_prj5_hemovida_usuarios`.
3. Configure as variaveis (Infisical, ou copie `.env.example` para `.env`). O `.env` nunca vai para o Git.
4. `npm run prisma:generate`
5. `npm run prisma:check` (confere se o `schema.prisma` bate com o banco; nao use `migrate dev`)
6. `npm run start`
7. `GET http://localhost:7503/health` deve responder `200 {"status":"ok","database":"up"}`

## Passos de construcao

- [x] 1. Base: config validada, Prisma, helmet, ValidationPipe, `/health`
- [x] 2. Modulo de usuarios (admin cria/lista/edita/desativa a equipe)
- [x] 3. Login da equipe (`POST /auth/login/admin`) + guards JWT/perfil
- [x] 4. Seed idempotente do primeiro ADMIN
- [x] 5. Endpoints internos (criar usuario DOADOR) + login do doador (`POST /auth/login/doador`)

## Contrato do token (o MS1 e o MS3 dependem disto)

HS256, mesmo `JWT_SECRET` nos 3 servicos. Payload: `{ sub: number, role: Perfil, hospitalId?: number }`.
