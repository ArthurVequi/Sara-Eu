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
- `DRIVE_CLIENT_ID`, `DRIVE_CLIENT_SECRET`, `DRIVE_REFRESH_TOKEN` e `DRIVE_STUDIES_FOLDER_ID`

No Supabase, aplique `supabase/schema.sql` a um projeto novo, configure a URL da Vercel
como URL de retorno do Auth, configure SMTP e crie os dois usuários autorizados.
Inclua o UUID de cada um em `public.organiza_members`. Ambos editam o mesmo espaço.
O primeiro acesso exige internet e usa um link por e-mail. A demonstração e o espaço
compartilhado usam bancos locais separados.

Para o Drive, autorize o aplicativo OAuth com a conta antigravidade72@gmail.com
e configure a pasta Estudos dentro de Organiza Aí. A pasta configurada precisa estar
acessível ao mesmo cliente OAuth. As pastas por matéria são criadas ao acessar seus
arquivos depois da primeira sincronização. A integração atual aceita envios de até
3 MB por arquivo, otimiza JPEG, PNG e WebP quando possível e preserva os demais formatos.
O visualizador abre imagens compatíveis, PDF e vídeo MP4/WebM. Outros formatos podem ser baixados.

O cron está configurado para 07h na Argentina. Ative o lembrete em cada aparelho
depois de instalar a PWA. A precisão depende do plano da Vercel. No iPhone, abra
pela tela de início antes de ativar. O toque abre a agenda do dia.

## Antes de usar com dados reais

Valide acesso com os dois usuários, funcionamento em modo avião, conflito entre
aparelhos, uploads e recebimento de push em iPhone e Android. A integração de
arquivos grandes, conversão de vídeos e fila de arquivos offline ainda está pendente.
