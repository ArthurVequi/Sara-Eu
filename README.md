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
- `DRIVE_CLIENT_ID`, `DRIVE_CLIENT_SECRET` e `DRIVE_REFRESH_TOKEN`

Em um Supabase novo, aplique `supabase/schema.sql` e depois `supabase/public-access.sql`.
O CoupleSA já recebeu essa migração. O app abre direto, sem login ou perfis.
O espaço é público: qualquer pessoa pode ler e editar os registros compartilhados,
inclusive pela API. Os arquivos das matérias também ficam acessíveis pelo app.
A demonstração e o espaço compartilhado usam bancos locais separados.

Para o Drive, habilite a Google Drive API, crie um cliente OAuth e autorize com a
conta antigravidade73@gmail.com e o escopo `https://www.googleapis.com/auth/drive.file`.
Cadastre o ID, o segredo e o refresh token na Vercel em Production. O app cria
`Organiza Aí - Estudos` no primeiro uso. Opcionalmente, configure
`DRIVE_STUDIES_FOLDER_ID` com uma pasta já acessível ao mesmo cliente OAuth.
As pastas por matéria são preparadas após a sincronização. O app aceita arquivos
de até 100 MB, guarda os envios pendentes no aparelho e retoma o envio ao voltar
a ficar online com o app aberto. Arquivos acima de 3 MB são transferidos em partes.
JPEG, PNG e WebP de até 3 MB são otimizados quando possível.
O visualizador abre imagens compatíveis, PDF e vídeo MP4/WebM. Outros formatos podem ser baixados.

O cron está configurado para 07h na Argentina. Ative o lembrete em cada aparelho
depois de instalar a PWA. A precisão depende do plano da Vercel. No iPhone, abra
pela tela de início antes de ativar. O toque abre a agenda do dia.

## Antes de usar com dados reais

Valide o funcionamento em modo avião, conflitos entre aparelhos, retomada de
uploads e recebimento de push em iPhone e Android. A conversão de vídeos ainda está pendente.
