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

## Evolucao Posterior

A fase 6.1 adicionou uma area admin separada em leitura e manteve a area do aluno sem acoes de escrita.

Notificacoes Android seguem adiadas ate aprovacao do dono da ferramenta sobre regras e mensagens.
