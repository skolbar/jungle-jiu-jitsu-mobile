# Auth Mobile

## Estado Atual

A fase 3 implementa login email/senha com Supabase Auth e sessao persistente no dispositivo.

Arquivos principais:

- `lib/supabase.ts`: cliente Supabase mobile.
- `contexts/auth.tsx`: estado global de sessao, perfil, login e logout.
- `app/login.tsx`: tela de entrada.
- `app/_layout.tsx`: rotas protegidas.

## Variaveis

O app usa apenas variaveis publicas do Expo:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
# EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Nao usar `SUPABASE_SERVICE_ROLE_KEY` no mobile.

## Perfil Atual

Apos obter uma sessao, o app consulta `profiles` com:

```sql
id = auth user id
```

As colunas seguem o contrato seguro usado pelo web:

```txt
id,email,full_name,role,belt,degree,total_classes,cycle_classes,avatar_url,belt_locked,created_at,updated_at
```

## Proximos Cuidados

- Validar RLS antes de expor telas com mais dados.
- Mover acoes administrativas para endpoints server-side.
- Considerar storage criptografado para sessoes se o risco do app aumentar.
