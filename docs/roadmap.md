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

Status: concluida.

Entregas:

- configurar Supabase client;
- login email/senha;
- logout;
- sessao persistente;
- tela de carregamento;
- rota protegida;
- leitura do perfil atual.

Observacao: o app usa apenas variaveis publicas `EXPO_PUBLIC_*`, persiste a sessao no AsyncStorage e busca somente o perfil do usuario autenticado.

## Fase 4 - Area Do Aluno

Status: concluida.

Entregas:

- home do aluno;
- aulas/presencas;
- perfil;
- comunicados;
- modulos/conteudos;
- check-in, se mantido no mobile.

Observacao: a primeira versao mobile da area do aluno e de leitura segura. Nao cria check-ins, nao altera perfil e nao executa fluxos administrativos.

## Fase 5 - Notificacoes Android

Status: adiada.

Entregas:

- permissao de notificacao;
- registro de push token;
- tela/estado de preferencia;
- contrato para backend enviar notificacoes;
- notificacoes para aula adicionada, ausencia prolongada e proximidade de graduacao.

Observacao: esta fase depende de alinhamento com o dono da ferramenta sobre regras e mensagens. Nenhuma feature de notificacao/mensagem sera implementada ate essa aprovacao.

## Fase 6 - Build Android E Validacao

Status: preparada.

Entregas:

- build APK/AAB com EAS;
- smoke test em aparelho Android;
- checklist de publicacao;
- plano de rollout controlado.

Observacao: `eas.json` foi configurado com `preview` em APK interno e `production` em AAB. O build real depende de conta Expo/EAS e variaveis Supabase publicas nos ambientes EAS.
