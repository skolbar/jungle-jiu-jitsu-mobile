# Estrategia De Notificacoes

## Casos De Uso

### Aula Adicionada

Quando uma presenca/aula for registrada para um aluno, o aluno pode receber:

> Sua presenca foi registrada. Voce esta com X aulas no ciclo atual.

Como as presencas hoje podem ser importadas por script semanal, a notificacao deve considerar importacoes em lote. O backend deve evitar enviar notificacoes duplicadas para presencas antigas ou ja notificadas.

### Ausencia Prolongada

Quando um aluno ficar muito tempo sem presenca registrada, o app pode receber:

> Sentimos sua falta no tatame. Ja fazem X dias desde sua ultima aula.

O criterio exato deve ser configuravel. Sugestao inicial:

- alerta leve com 7 dias sem aula;
- alerta mais forte com 14 dias sem aula;
- evitar repetir o mesmo alerta todo dia.

### Proximo Da Graduacao

Quando o aluno estiver perto das aulas necessarias para graduar:

> Falta pouco para sua proxima graduacao. Voce esta com X/Y aulas.

Sugestao inicial:

- notificar quando atingir 80% do requisito;
- notificar novamente quando atingir 95%;
- nao notificar se ja estiver pronto e aguardando acao do professor, salvo se essa for uma regra desejada.

## Dados Necessarios

Uma estrutura futura pode incluir:

- tabela `push_tokens`;
- tabela `notification_events`;
- campo para ultima notificacao por tipo;
- idempotencia por evento de presenca;
- preferencias do usuario.

## Regra De Seguranca

O envio de notificacoes deve acontecer no servidor, nao diretamente no app.

O app apenas:

- pede permissao;
- registra token;
- envia/atualiza token autenticado;
- mostra estado de notificacoes.

O servidor:

- decide quem deve receber;
- monta mensagem;
- envia push;
- registra evento enviado.

