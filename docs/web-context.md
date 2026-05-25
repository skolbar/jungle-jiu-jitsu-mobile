# Contexto Do Sistema Web

## Sistema Atual

A aplicacao web oficial fica no repo:

`skolbar/jungle-jiu-jitsu-mvp`

Projeto Vercel:

`v0-jiu-jitsu-mvp`

Banco Supabase:

`JungleApp`

## Presencas

As presencas nao vem mais de API de catraca em tempo real.

Fluxo atual:

1. Um professor exporta semanalmente um relatorio do sistema da academia.
2. O script local do usuario processa esse relatorio.
3. O script adiciona as presencas no Supabase.

Importante:

- Nao modificar o script de importacao sem pedido explicito.
- O mobile deve ser compativel com presencas importadas em lote.
- Notificacoes de aula adicionada precisam evitar duplicidade quando a importacao semanal insere muitas presencas.

## Producao

Producao web nao deve ser alterada durante desenvolvimento mobile sem uma decisao explicita.

O mobile deve iniciar consumindo contratos ja existentes ou endpoints novos em preview/staging.

