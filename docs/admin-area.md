# Area Admin Mobile

## Estado Atual

A etapa de finalizacao separa a experiencia mobile por `profile.role` e traz as principais acoes admin da web para o Android.

Quando o usuario autenticado tem `role = admin`, o app mostra uma area propria em vez da area de aluno.

Telas:

- Painel: contadores, alunos proximos de graduacao, ultimas presencas e alunos ausentes.
- Alunos: lista pesquisavel, criar aluno real, editar nome/faixa/grau, adicionar aulas, promover graduacao e remover perfil.
- Conteudos: biblioteca com acesso liberado para admin, criacao e exclusao de conteudos.
- Avisos: comunicados, validacao de check-ins e catraca virtual.
- Perfil: foto, nome, senha, dados do admin e logout.

## Escopo De Seguranca

As acoes administrativas sensiveis nao usam `SUPABASE_SERVICE_ROLE_KEY` no APK.

O app usa o token Supabase do usuario autenticado como `Authorization: Bearer <access_token>` e chama a API segura da aplicacao web em `EXPO_PUBLIC_WEB_API_URL`. A API web continua validando:

- usuario autenticado;
- `profile.role = admin`;
- formato do payload;
- operacoes que exigem servidor, como criacao real de usuario Auth.

## Dados Lidos

Leituras simples continuam usando o cliente Supabase autenticado e as permissoes existentes:

- `profiles` para alunos;
- `attendances` para presencas e ausencias;
- `contents` para biblioteca;
- `announcements` para comunicados.

O app mobile continua sem `SUPABASE_SERVICE_ROLE_KEY`.

## Acoes Via API Web

- `POST /api/admin/create-user`
- `PATCH /api/students/:id`
- `DELETE /api/students/:id`
- `PATCH /api/students/:id/add-classes`
- `POST /api/attendances`
- `GET/PATCH /api/check-ins`
- `PATCH /api/check-ins/bulk`
- `POST /api/announcements`
- `POST /api/contents`
- `DELETE /api/contents/:id`
- `PATCH /api/profile`
- `PATCH /api/profile/password`
