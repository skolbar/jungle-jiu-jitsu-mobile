# Publicacao Na Google Play Store

Este guia descreve o primeiro envio do app Android `Jungle Jiu-Jitsu` para a Google Play Console.

## Arquivo De Envio

Use sempre o arquivo `.aab` gerado pelo perfil EAS `production`.

- Projeto EAS: `@skolbar/jungle-jiu-jitsu-mobile`
- Pacote Android: `com.skolbar.junglejiujitsu`
- Tipo de build: `app-bundle`
- Distribuicao: `store`
- AAB atual: `builds/jungle-jiu-jitsu-1.0.0-code4.aab`
- Link EAS: `https://expo.dev/artifacts/eas/65LAgewsVCz91WqwHLKjQx.aab`
- Version code: `4`
- Politica de privacidade: `https://v0-jiu-jitsu-mvp.vercel.app/politica-de-privacidade`

O version code 4 substitui o code 3 e inclui acesso a politica de privacidade e a solicitacao de exclusao de conta dentro do aplicativo.

## Antes De Criar O App

Tenha em maos:

- Nome do app: `Jungle Jiu-Jitsu`
- Icone de alta resolucao: `assets/images/icon.png`
- Arquivo AAB de producao gerado pelo EAS
- Email de contato publico da academia/empresa
- Politica de privacidade em uma URL publica
- Texto curto e descricao completa da loja
- Capturas de tela do app em celular Android

## Pontos Obrigatorios Importantes

O app usa login e dados pessoais de alunos. Na Play Console, preencha as declaracoes com cuidado:

- O app coleta ou processa dados como nome, email, foto de perfil, graduacao e presencas.
- O app usa comunicacao criptografada em transito via HTTPS/Supabase.
- O app nao deve declarar anuncios se nao exibir anuncios.
- O app nao deve declarar permissao de microfone como recurso usado pelo produto.
- Se a Play Console solicitar exclusao de conta, informe um fluxo real de solicitacao/remocao de dados.

## Passo A Passo

1. Acesse a Google Play Console.
2. Clique em `Todos os apps`.
3. Clique em `Criar app`.
4. Preencha:
   - Nome do app: `Jungle Jiu-Jitsu`
   - Idioma padrao: `Portugues (Brasil)`
   - App ou jogo: `App`
   - Gratuito ou pago: conforme decisao do cliente, normalmente `Gratuito`
5. Aceite as declaracoes iniciais e crie o app.
6. Abra `Configurar app`.
7. Em `Detalhes do app`, preencha:
   - Descricao curta
   - Descricao completa
   - Icone do app
   - Capturas de tela de telefone
   - Categoria: normalmente `Esportes` ou `Saude e fitness`
   - Dados de contato
8. Em `Politica de privacidade`, informe a URL publica.
9. Em `Seguranca dos dados`, declare os dados realmente usados pelo app.
10. Em `Classificacao de conteudo`, responda o questionario.
11. Em `Publico-alvo e conteudo`, escolha a faixa etaria correta.
12. Em `Apps de noticias`, marque que nao e app de noticias.
13. Em `COVID-19/contact tracing`, marque que nao se aplica, se essa pergunta aparecer.
14. Em `Acesso ao app`, informe credenciais de teste para revisao do Google.
15. Va em `Testar e lancar`.
16. Entre em `Teste interno` primeiro.
17. Crie uma versao de teste interno.
18. Envie o arquivo `.aab`.
19. Adicione notas da versao, por exemplo:

```text
Primeira versao Android do app Jungle Jiu-Jitsu para alunos e administradores da academia.
```

20. Revise os avisos da Play Console.
21. Publique no teste interno.
22. Instale pelo link de teste interno e valide login, abas, conteudos, presencas, comunicados e perfil.
23. Depois do aceite final, promova a mesma versao para `Producao`.

## Credenciais Para Revisao

Crie ou informe um usuario de teste que o Google possa acessar sem depender de atendimento manual.

Recomendado:

- Um login de aluno de teste
- Um login de admin de teste, se o Google precisar validar area administrativa

Nao use senha pessoal ou senha de cliente real.

## Checklist Final

- AAB foi gerado pelo perfil `production`.
- Version code do AAB e maior que qualquer upload anterior.
- Icone do app aparece com a marca da academia.
- Politica de privacidade esta publica e acessivel sem login.
- Conta de teste funciona fora da rede local.
- Producao web continua respondendo.
- Banco Supabase foi conferido somente em leitura antes da publicacao.
