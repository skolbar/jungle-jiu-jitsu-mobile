# Area Do Aluno Mobile

## Estado Atual

A fase 4 adiciona as principais telas do aluno em modo leitura.

Telas:

- Inicio: resumo do aluno, progresso de graduacao, ultima presenca e ritmo de treino.
- Presencas: historico recente de presencas do aluno autenticado.
- Conteudos: modulos agrupados por `module_slug`, com bloqueio visual por faixa/grau.
- Comunicados: lista de comunicados publicados.
- Perfil: dados principais do aluno e logout.

## Contratos De Dados

As consultas usam o cliente Supabase autenticado com a chave publica.

Tabelas lidas:

- `profiles`
- `attendances`
- `contents`
- `announcements`

Presencas sao filtradas por:

```txt
student_id = user.id
```

## Decisoes De Seguranca

- Nenhuma tela administrativa foi adicionada.
- Nenhum fluxo de escrita foi adicionado nesta fase.
- Check-in mobile segue fora da interface enquanto o fluxo real de presencas depende do script semanal de importacao.
- Conteudos bloqueados continuam aparecendo apenas como indisponiveis no app; a seguranca real deve permanecer no backend/RLS.

## Proxima Fase

A fase 5 deve introduzir notificacoes Android:

- permissao local;
- registro de push token;
- preferencias;
- contrato server-side para envio seguro.
