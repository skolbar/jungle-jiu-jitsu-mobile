# Build Android

## Estado Atual

A fase de notificacoes foi adiada ate aprovacao do dono da ferramenta.

Enquanto isso, a configuracao Android foi preparada para build com EAS:

- `preview`: gera APK para teste interno.
- `production`: gera AAB para Google Play.
- `development`: gera APK com development client, se necessario.

## Arquivos

- `eas.json`: perfis de build e submit.
- `.easignore`: arquivos excluidos do pacote enviado ao EAS.
- `app.json`: pacote Android `com.skolbar.junglejiujitsu`.

## Variaveis Necessarias

Configurar nos ambientes EAS `preview` e `production`:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
# ou EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
EXPO_PUBLIC_WEB_API_URL=https://v0-jiu-jitsu-mvp.vercel.app
```

Nao configurar `SUPABASE_SERVICE_ROLE_KEY` no app mobile.

## Comandos De Validacao

```bash
npm run lint
npm run typecheck
npm audit --audit-level=moderate
npx expo install --check
npm run doctor
npx expo config --type public
```

Os comandos abaixo validam a configuracao EAS, mas exigem login Expo/EAS ou `EXPO_TOKEN`:

```bash
npm run eas:config:android:preview
npm run eas:inspect:android:preview
```

## Builds

APK interno:

```bash
npm run build:android:preview
```

AAB de producao:

```bash
npm run build:android:production
```

## Checklist Antes De Entregar APK

- Autenticar EAS com `eas login` ou `EXPO_TOKEN`.
- Confirmar variaveis Supabase e `EXPO_PUBLIC_WEB_API_URL` no EAS.
- Fazer login com aluno real de teste.
- Verificar Inicio, Presencas, Conteudos, Comunicados e Perfil.
- Fazer login com admin real de teste.
- Verificar Painel, Alunos, Conteudos, Avisos/Check-ins/Catraca e Perfil.
- Confirmar que check-in continua fora do mobile enquanto o fluxo semanal por importacao estiver ativo.
- Testar logout e reabertura do app.
- Validar em pelo menos um aparelho Android fisico.

## Rollout

Usar primeiro o perfil `preview` e distribuir apenas para testadores internos. O perfil `production` deve ser usado somente depois do aceite do dono da ferramenta.

## Primeiro Build Preview

Build Android interno gerado em 2026-05-26:

- EAS project: `@skolbar/jungle-jiu-jitsu-mobile`
- EAS project ID: `0b7449e8-da68-4041-9774-832cc0d57189`
- Build ID: `51bc610a-e57e-490b-b082-f503ff2e80d2`
- Perfil: `preview`
- Plataforma: Android
- Status: `FINISHED`
- Artefato: `https://expo.dev/artifacts/eas/b6pamqh8HxbzeNEagJUMZU.apk`
- Expira em: 2026-06-09

Este APK e apenas para teste interno. Antes de qualquer distribuicao ampla, validar login, abas, leitura de dados, logout e reabertura em aparelho Android fisico.

## Segundo Build Preview

Build Android interno gerado em 2026-05-26 apos validacao em aparelho real:

- EAS project: `@skolbar/jungle-jiu-jitsu-mobile`
- EAS project ID: `0b7449e8-da68-4041-9774-832cc0d57189`
- Build ID: `0420f2f9-588e-46ad-b33d-c2e6a90daa21`
- Commit: `9b437e2 Add admin mobile area and Android UI fixes`
- Perfil: `preview`
- Plataforma: Android
- Status: `FINISHED`
- Artefato: `https://expo.dev/artifacts/eas/vz52H8T1fAnP7gUi3jMAa.apk`
- Expira em: 2026-06-09

Mudancas principais deste APK:

- admin nao cai mais na mesma experiencia do aluno;
- painel admin mobile em leitura;
- lista de alunos para admin em leitura;
- conteudos liberados para admin;
- safe area no topo do Android;
- contraste corrigido em cards brancos e escuros;
- rotulo `Comunicados` encurtado para `Avisos` na navegacao inferior.

## Terceiro Build Preview

Build Android interno gerado em 2026-06-07 apos finalizacao de paridade mobile/web:

- EAS project: `@skolbar/jungle-jiu-jitsu-mobile`
- EAS project ID: `0b7449e8-da68-4041-9774-832cc0d57189`
- Build ID: `ab1d43c8-6e4b-484d-9c93-935d302becbc`
- Commit: `b4a9b6c Complete mobile admin and profile parity`
- Perfil: `preview`
- Plataforma: Android
- Status: `FINISHED`
- Artefato: `https://expo.dev/artifacts/eas/n8x4XNpU8xiTxXx3HnxteW.apk`

Mudancas principais deste APK:

- admin pode criar/editar/remover aluno, adicionar aulas e promover graduacao;
- admin pode criar/excluir conteudos;
- admin pode publicar comunicados, validar check-ins e registrar presenca na catraca virtual;
- aluno e admin podem alterar foto, nome e senha;
- aluno pode definir faixa/grau uma unica vez quando ainda nao bloqueado;
- app usa API web segura com Bearer token Supabase para acoes sensiveis;
- `SUPABASE_SERVICE_ROLE_KEY` continua fora do APK.

## Primeiro Build Production AAB

Build Android de producao gerado em 2026-06-07 para preparacao da Google Play:

- EAS project: `@skolbar/jungle-jiu-jitsu-mobile`
- EAS project ID: `0b7449e8-da68-4041-9774-832cc0d57189`
- Build ID: `8b443197-7953-4a5e-b5b0-f5b2594d5d66`
- Commit: `eaa83c7 Record final parity preview APK`
- Perfil: `production`
- Plataforma: Android
- Formato: `AAB`
- Version code: `2`
- Status: `FINISHED`
- Artefato: `https://expo.dev/artifacts/eas/icrpmZRk5msqYQVchSmtxm.aab`

Este artefato ainda nao publica o app. Ele e o arquivo de upload para a Google Play Console apos validacao final em aparelho fisico.

## Segundo Build Production AAB

Build Android de producao gerado em 2026-06-08 apos troca do icone pela marca da academia:

- EAS project: `@skolbar/jungle-jiu-jitsu-mobile`
- EAS project ID: `0b7449e8-da68-4041-9774-832cc0d57189`
- Build ID: `954752cb-a4f2-4b51-b9db-c78a93749eac`
- Commit: `1d5bf51 Update Android app icon branding`
- Perfil: `production`
- Plataforma: Android
- Formato: `AAB`
- Version code: `3`
- Status: `FINISHED`
- Artefato: `https://expo.dev/artifacts/eas/jr9uwAkcAw1gtF6XcGN8KA.aab`
- Copia local: `builds/jungle-jiu-jitsu-1.0.0-code3.aab`

Este e o arquivo recomendado para o primeiro upload na Google Play Store.

## Terceiro Build Production AAB

Build Android de producao gerado apos publicacao da politica de privacidade e inclusao dos links dentro do app:

- EAS project: `@skolbar/jungle-jiu-jitsu-mobile`
- EAS project ID: `0b7449e8-da68-4041-9774-832cc0d57189`
- Build ID: `292825fd-56b6-4532-924f-8ac3c56ee71f`
- Commit: `4ab3c52 Add in-app privacy policy link`
- Perfil: `production`
- Plataforma: Android
- Formato: `AAB`
- Version code: `4`
- Status: `FINISHED`
- Artefato: `https://expo.dev/artifacts/eas/65LAgewsVCz91WqwHLKjQx.aab`
- Copia local: `builds/jungle-jiu-jitsu-1.0.0-code4.aab`
- Politica publica: `https://v0-jiu-jitsu-mvp.vercel.app/politica-de-privacidade`

Este bundle substitui o version code 3 para publicacao na Google Play.
