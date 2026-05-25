# Jungle Jiu-Jitsu Mobile

Aplicativo Android para alunos e equipe da Jungle Jiu-Jitsu.

Este repositorio e separado da aplicacao web para manter o mobile isolado, privado e sem risco de acionar deploys da Vercel do sistema web.

## Status

Fase atual: **Fase 1 - repositorio e base de contexto**.

Esta fase cria a base do projeto mobile. O app Expo/React Native sera criado na proxima fase.

## Objetivo Inicial

Construir um aplicativo Android que replique os principais fluxos do sistema atual e adicione uma camada mobile de notificacoes para alunos.

Prioridades mobile:

- Login de aluno.
- Home do aluno.
- Perfil.
- Historico de aulas.
- Comunicados.
- Modulos/conteudos.
- Check-in quando aplicavel.
- Notificacoes push para:
  - aula/presenca adicionada;
  - ausencia prolongada;
  - aluno proximo da graduacao.

## Stack Planejada

- React Native.
- Expo.
- TypeScript.
- Expo Router.
- Supabase JS para Auth, dados e storage.
- Expo Notifications para notificacoes push Android.
- EAS Build para gerar APK/AAB Android.

## Repos Relacionados

- Web: `skolbar/jungle-jiu-jitsu-mvp`
- Mobile: `skolbar/jungle-jiu-jitsu-mobile`

## Regras De Seguranca

- Nunca colocar `SUPABASE_SERVICE_ROLE_KEY` no aplicativo mobile.
- O app mobile deve usar apenas chave publica/anonima do Supabase e depender de RLS ou APIs seguras.
- Funcoes administrativas sensiveis devem passar por endpoints server-side seguros.
- Producao web e banco de producao nao devem ser alterados sem validacao explicita.

