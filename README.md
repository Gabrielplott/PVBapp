# Estúdio — App de Gestão da Escola de Ballet

Este é o mesmo app que já usamos como artefato, adaptado para rodar como
um site próprio, com banco de dados real (Supabase) e login com senha.

## Passo 1 — Criar o banco de dados (Supabase)

1. Acesse https://supabase.com e crie uma conta gratuita.
2. Clique em **New project**. Escolha um nome (ex.: `estudio-ballet`) e uma senha
   forte para o banco (guarde essa senha em local seguro — não é a senha de login do app).
3. Aguarde o projeto ser criado (leva ~2 minutos).
4. No menu lateral, vá em **SQL Editor** → **New query**.
5. Copie todo o conteúdo do arquivo `supabase-schema.sql` (deste projeto) e
   cole lá. Clique em **Run**. Isso cria a tabela onde tudo (turmas, alunas,
   presenças, pagamentos, contratos, financeiro) vai ficar salvo.
6. Vá em **Authentication** → **Users** → **Add user** → **Create new user**.
   Cadastre o e-mail e a senha que a dona da escola vai usar para entrar no
   app (marque "Auto Confirm User").
7. Vá em **Project Settings** → **API**. Copie os valores de:
   - **Project URL**
   - **anon public key**
   Você vai usar os dois no Passo 2.

## Passo 2 — Configurar o projeto

1. Extraia esta pasta no seu computador e abra um terminal nela.
2. Rode: `npm install`
3. Copie o arquivo `.env.example` para um novo arquivo chamado `.env`
4. Abra o `.env` e cole os valores do Supabase que você copiou:
   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
5. Para testar localmente: `npm run dev` (abre em http://localhost:5173)

## Passo 3 — Publicar o site (Vercel)

1. Crie uma conta gratuita em https://vercel.com (dá pra entrar com GitHub).
2. Suba esta pasta para um repositório no GitHub (crie um repositório novo
   e siga as instruções do próprio GitHub para enviar os arquivos).
3. Na Vercel, clique em **Add New** → **Project** → selecione o repositório.
4. Em **Environment Variables**, adicione as duas mesmas variáveis do `.env`:
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
5. Clique em **Deploy**. Em ~1 minuto você recebe um link (ex.:
   `estudio-ballet.vercel.app`) — esse é o link definitivo para você e a
   dona da escola usarem, inclusive instalando na tela inicial do celular.

## Como funciona o login

Só quem tiver e-mail e senha cadastrados no Supabase (Passo 1.6) consegue
entrar. Os dados de cada usuário logado ficam isolados por conta — se no
futuro quiser dar acesso a mais alguém (ex.: uma secretária) com os mesmos
dados, me avise: dá pra ajustar a tabela para "família de usuários"
compartilhada em vez de por conta individual.

## Backup dos dados

Recomendo fortemente pedir para eu adicionar um botão de exportar/baixar
backup dentro do app — assim você sempre tem uma cópia de segurança, além
do banco do Supabase (que também é confiável, mas nunca custa ter as duas
camadas).
