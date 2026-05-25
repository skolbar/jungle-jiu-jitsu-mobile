# Roadmap Mobile

## Fase 1 - Repositorio E Contexto

Status: concluida.

Entregas:

- criar repo privado separado;
- registrar stack planejada;
- registrar regras de seguranca;
- registrar estrategia de notificacoes;
- preparar base para scaffold Expo.

## Fase 2 - Scaffold Expo Android

Status: concluida.

Entregas:

- criar app Expo com TypeScript;
- configurar Expo Router;
- configurar lint/typecheck;
- configurar tema visual inicial;
- criar `.env.example`;
- preparar scripts de dev/build.

Observacao: a base foi validada com lint, typecheck, audit, `expo install --check` e `expo-doctor`.

## Fase 3 - Auth E Sessao

Entregas:

- configurar Supabase client;
- login email/senha;
- logout;
- sessao persistente;
- tela de carregamento;
- rota protegida;
- leitura do perfil atual.

## Fase 4 - Area Do Aluno

Entregas:

- home do aluno;
- aulas/presencas;
- perfil;
- comunicados;
- modulos/conteudos;
- check-in, se mantido no mobile.

## Fase 5 - Notificacoes Android

Entregas:

- permissao de notificacao;
- registro de push token;
- tela/estado de preferencia;
- contrato para backend enviar notificacoes;
- notificacoes para aula adicionada, ausencia prolongada e proximidade de graduacao.

## Fase 6 - Build Android E Validacao

Entregas:

- build APK/AAB com EAS;
- smoke test em aparelho Android;
- checklist de publicacao;
- plano de rollout controlado.
