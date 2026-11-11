# Organiza Aí

Execute `npm ci` e `npm run dev` para abrir a demonstração local com dados fictícios.
`npm run build` valida TypeScript e gera a PWA. `npm run preview` serve o resultado.

## Configuração na Vercel

Use um projeto Vercel novo com preset Vite. Cadastre as variáveis abaixo na Vercel.
As variáveis sem prefixo `VITE_` são exclusivas do servidor. Não coloque tokens no Git.

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` para o envio agendado
- `CRON_SECRET` para autenticar o cron
- `VITE_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` para Web Push

Em um Supabase novo, aplique `supabase/schema.sql` e depois `supabase/public-access.sql`.
O CoupleSA já recebeu essa migração. O app abre direto, sem login ou perfis.
O espaço é público: qualquer pessoa pode ler e editar os registros compartilhados,
inclusive pela API.
A demonstração e o espaço compartilhado usam bancos locais separados.

O cron está configurado para 07h na Argentina. Ative o lembrete em cada aparelho
depois de instalar a PWA. A precisão depende do plano da Vercel. No iPhone, abra
pela tela de início antes de ativar. O toque abre a agenda do dia.

## Antes de usar com dados reais

Valide o funcionamento em modo avião, conflitos entre aparelhos e recebimento
de push em iPhone e Android.
