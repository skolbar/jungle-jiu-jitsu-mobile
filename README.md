# Jungle Jiu-Jitsu Mobile

Aplicativo Android para alunos e equipe da Jungle Jiu-Jitsu.

Este repositorio e separado da aplicacao web para manter o mobile isolado, privado e sem risco de acionar deploys da Vercel do sistema web.

## Status

Fase atual: **Fase 2 concluida - scaffold Expo Android**.

O projeto ja possui base Expo com TypeScript e Expo Router. A autenticacao real com Supabase sera implementada na Fase 3.

Validacoes da fase 2:

- `npm run lint`
- `npm run typecheck`
- `npm audit --audit-level=moderate`
- `npx expo install --check`
- `npm run doctor`

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

## Desenvolvimento

Requisito de runtime:

- Node.js `22.13+` ou `24.3+`, conforme requisito atual do React Native/Metro usado pelo Expo.

Comandos:

```bash
npm install
npm run start
npm run android
npm run lint
npm run typecheck
npm run doctor
```

Variaveis:

```bash
cp .env.example .env
```

Somente variaveis com prefixo `EXPO_PUBLIC_` ficam disponiveis no app. Nao coloque segredos privados nelas.
