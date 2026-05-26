# Arquitetura Mobile

## Decisao Principal

O app sera construido com React Native + Expo + TypeScript.

Motivos:

- O sistema web atual ja usa React, TypeScript e Supabase.
- A equipe ganha velocidade por reaproveitar conceitos, nomes de dominio e contratos de dados.
- Expo simplifica desenvolvimento Android, testes em aparelho e build APK/AAB.
- Mantem caminho aberto para iOS no futuro, mesmo que o primeiro alvo seja somente Android.

## Camadas

### App Mobile

Responsavel por:

- interface nativa Android;
- autenticacao do usuario;
- sessao persistente;
- navegacao;
- exibicao de dados;
- registro do token de push notification;
- chamadas seguras ao Supabase ou APIs server-side.

### Supabase

Responsavel por:

- Auth;
- dados do aluno;
- presencas;
- check-ins;
- comunicados;
- conteudos;
- storage de avatar;
- politicas RLS.

### Backend Seguro

Pode ser a propria aplicacao web Next.js ou endpoints dedicados no futuro.

Responsavel por:

- operacoes administrativas;
- notificacoes push;
- rotinas agendadas;
- tarefas que exigem chave privilegiada.

## Auth

O mobile deve usar Supabase Auth com persistencia de sessao no aparelho.

Principios:

- login por email/senha no primeiro momento;
- sessao guardada com AsyncStorage no primeiro momento;
- leitura do perfil autenticado apos login;
- roteamento por papel do usuario quando necessario.

Implementacao atual:

- `lib/supabase.ts` cria o cliente Supabase somente quando as variaveis publicas estao configuradas.
- `contexts/auth.tsx` centraliza sessao, login, logout e leitura do perfil atual.
- `app/_layout.tsx` usa rotas protegidas do Expo Router para separar login e area autenticada.
- O app consulta a tabela `profiles` filtrando pelo `id` do usuario autenticado.

## Dados

Para a primeira versao, o mobile deve priorizar telas de aluno.

Fluxos de admin podem entrar depois, pois tem maior risco de permissao e exigem endpoints server-side mais cuidadosamente revisados.

Implementacao da area do aluno:

- `app/(tabs)/index.tsx`: resumo, progresso e ultima presenca.
- `app/(tabs)/attendance.tsx`: historico recente de presencas do aluno autenticado.
- `app/(tabs)/contents.tsx`: modulos e conteudos com bloqueio visual por faixa/grau.
- `app/(tabs)/announcements.tsx`: comunicados.
- `app/(tabs)/profile.tsx`: dados do perfil e logout.
- `lib/data.ts`: consultas Supabase de leitura para presencas, conteudos e comunicados.

As consultas de presenca usam `student_id = user.id`. Alteracoes de dados permanecem fora da fase 4.

## Notificacoes

As notificacoes nao devem depender apenas do app aberto.

Sera necessario:

- registrar o push token do aparelho;
- associar token ao usuario autenticado;
- armazenar status de permissao;
- criar uma rotina server-side para decidir quem deve ser notificado;
- enviar notificacoes via Expo Push API ou provider equivalente.
