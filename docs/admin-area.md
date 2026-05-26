# Area Admin Mobile

## Estado Atual

A fase 6.1 separa a experiencia mobile por `profile.role`.

Quando o usuario autenticado tem `role = admin`, o app mostra uma area propria em vez da area de aluno.

Telas:

- Painel: contadores, alunos proximos de graduacao, ultimas presencas e alunos ausentes.
- Alunos: lista pesquisavel de alunos, faixa, grau, aulas e progresso.
- Conteudos: biblioteca com acesso liberado para admin.
- Comunicados: lista de comunicados publicados.
- Perfil: dados do admin e logout.

## Escopo De Seguranca

Esta primeira versao admin e de leitura.

Nao foram adicionadas acoes administrativas sensiveis no APK:

- criar aluno;
- remover aluno;
- editar perfil;
- adicionar aulas;
- alterar faixa/grau;
- validar check-ins;
- criar conteudos ou comunicados.

Essas acoes devem ser tratadas em uma fase propria, com confirmacoes, testes em ambiente duplicado e revisao de permissoes antes de ir para usuarios reais.

## Dados Lidos

O app usa o cliente Supabase autenticado e as permissoes existentes:

- `profiles` para alunos;
- `attendances` para presencas e ausencias;
- `contents` para biblioteca;
- `announcements` para comunicados.

O app mobile continua sem `SUPABASE_SERVICE_ROLE_KEY`.
