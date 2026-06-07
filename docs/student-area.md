# Area Do Aluno Mobile

## Estado Atual

A area do aluno tem as principais telas de consulta e os ajustes de perfil equivalentes a web.

Telas:

- Inicio: resumo do aluno, progresso de graduacao, ultima presenca e ritmo de treino.
- Presencas: historico recente de presencas do aluno autenticado.
- Conteudos: modulos agrupados por `module_slug`, com bloqueio visual por faixa/grau.
- Comunicados: lista de comunicados publicados.
- Perfil: dados principais, foto, nome, senha, definicao unica de faixa/grau quando desbloqueada e logout.

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
- Escritas do perfil usam a API segura da web com token Supabase do proprio usuario.
- Check-in mobile segue fora da interface enquanto o fluxo real de presencas depende do script semanal de importacao.
- Conteudos bloqueados continuam aparecendo apenas como indisponiveis no app; a seguranca real deve permanecer no backend/RLS.

## Evolucao Posterior

A etapa de finalizacao adicionou area admin com acoes principais e perfil do aluno editavel via API segura.

Notificacoes Android seguem adiadas ate aprovacao do dono da ferramenta sobre regras e mensagens.
