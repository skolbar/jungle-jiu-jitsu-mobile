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
- Confirmar variaveis Supabase no EAS.
- Fazer login com aluno real de teste.
- Verificar Inicio, Presencas, Conteudos, Comunicados e Perfil.
- Confirmar que nenhuma acao administrativa aparece no app.
- Confirmar que check-in continua fora do mobile enquanto o fluxo semanal por importacao estiver ativo.
- Testar logout e reabertura do app.
- Validar em pelo menos um aparelho Android fisico.

## Rollout

Usar primeiro o perfil `preview` e distribuir apenas para testadores internos. O perfil `production` deve ser usado somente depois do aceite do dono da ferramenta.
