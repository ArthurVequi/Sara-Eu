# Contexto do projeto Organiza Aí

Este documento serve para continuar o desenvolvimento em outro chat do Codex. O código e o Git são a fonte de verdade; confira o estado do repositório antes de editar.

## Como continuar

Abra a pasta `C:\Users\Arthur Vequi\Desktop\AppNamorada` como projeto no novo chat e envie:

> Leia `CONTEXTO-PARA-NOVO-CHAT.md`, confira o estado atual do Git e continue o desenvolvimento diretamente neste repositório. Preserve as decisões de produto e o padrão visual descritos aqui. Para mudanças concluídas, valide proporcionalmente, faça commits em português usando Conventional Commits e envie para `origin main` quando apropriado.

## Produto e escopo

- Nome: **Organiza Aí**.
- PWA para celular e tablet, também utilizável no navegador. Usuária principal é estudante de medicina.
- Interface simples, moderna, visual, organizada em abas e acessível a pessoas pouco familiarizadas com tecnologia.
- Abas: Início, Semana, Estudos e Finanças.
- Sem autenticação ou perfis: qualquer pessoa com o link consegue acessar o espaço compartilhado. A mesma visão é compartilhada.
- Dados locais com Dexie para uso offline; Supabase sincroniza quando há conexão. Push matinal direciona para os compromissos do dia. Usuário confirmou que as notificações funcionam.
- Moeda: pesos argentinos (ARS).
- Não há mais upload, leitura ou armazenamento de arquivos no app. A integração com Google Drive e o backend relacionado foram removidos. Não reintroduzir sem pedido explícito.
- Dados fictícios foram inseridos no espaço Supabase de demonstração para Início/Semana/Estudos/Finanças. Script idempotente em `supabase/demo-seed.sql`.

## Stack e arquitetura

- React 19 + TypeScript + Vite; PWA por `vite-plugin-pwa`; CSS próprio; Motion.
- Persistência local: Dexie. Sincronização compartilhada: Supabase.
- Vercel hospeda o projeto existente `sara-eu`; URL pública `https://couplesa.vercel.app/`.
- Repositório remoto: `https://github.com/ArthurVequi/Sara-Eu.git`, branch `main`.
- Arquivos principais: `src/main.tsx`, `src/style.css`, `src/cloud.ts`, `src/SplashScreen.tsx`, `api/morning.js`, `api/push-subscribe.js`, `supabase/schema.sql`, `supabase/public-access.sql`, `supabase/demo-seed.sql`.
- Deploy é disparado pelo push para `main`.

## Identidade visual já definida

- Paleta: verde escuro `#112c0f`, verde claro `#c9fa6a`, teal `#13b195`, fundo pastel `#edf4e9`, superfícies brancas.
- Fonte Bricolage Grotesque em toda a aplicação.
- Ícones SVG da família Lucide/Better Icons, pequenos e funcionais.
- Fundo pastel de baixo contraste, cartões de cantos arredondados, navegação inferior fixa no celular.
- Splash screen de 1,5 s com nome real e identidade original, respeita `prefers-reduced-motion`.

## Funcionalidades de interface

- **Semana:** calendário mensal próprio com setas e agenda do dia. Compromissos podem repetir semanalmente. Botão de adicionar fica no canto inferior direito. Editor em folha/modal; data usa calendário customizado em modal com fundo desfocado; horário digitável.
- **Estudos:** submenu expansível Próximos prazos, com até três provas/revisões próximas ou frases vazias rotativas. Submenu expansível Matérias, com lista e matérias/conteúdos em cascata. Matéria pode ter dia e horário semanal, refletidos como recorrência no calendário. Prova e revisão podem se vincular a conteúdo. Ações de editar/excluir usam ícones.
- **Finanças:** resumo de disponível, reservado e gasto; contas, categorias, limite mensal, gastos, contas fixas e parcelas. Navegação mensal própria com setas (sem input nativo de mês). Botão flutuante abre Entrada ou Saída; cada grupo revela tipos em cascata.
- **Sincronização:** conflito é mostrado antes de escolher quais dados manter; operação local segue disponível.

## Banco e dados de demonstração

- Projeto Supabase conectado ao app tem tabela pública `organiza_workspace`, registro `id = 1`, contendo um JSON `entries` e controle `version`.
- Alterações da conversa adicionaram 16 registros `demo-*`, preservando uma matéria pré-existente. Totais confirmados após inserção: 17 registros, 3 Semana, 6 Estudos e 7 Finanças (contagens incluem apenas dados fictícios por área).
- Reaplicar `supabase/demo-seed.sql` não duplica entradas, pois filtra IDs fixos.
- O espaço é público e qualquer pessoa com a URL pode ler/editar; nunca presumir privacidade.

## Histórico recente no Git

- `aae096c feat: reorganizar ações e período das finanças` — navegação de mês e menu financeiro em cascata; teste Playwright mobile em `tests/finance_ui_check.py`.
- `be11772 chore: adicionar dados fictícios de demonstração` — script idempotente de seed do Supabase; os dados já foram inseridos na instância conectada.
- `0f832ea refactor: remover carregamento de arquivos dos estudos` — remove integração Drive, upload e processamento de arquivos.
- `c4aa236 style: arredondar caixas de conclusão nas listas`.
- `e10f6e8 feat: indicar expansão de matérias e conteúdos com ícones`.

Última informação conhecida: `main` estava limpa após `aae096c`. Confirme novamente com `git status`, `git log` e `git remote -v` antes de trabalhar.

## Comandos úteis

- `npm run dev` — servidor local.
- `npm run build` — TypeScript e build PWA.
- `npm run preview` — pré-visualização do build.
- Teste focado mobile existente: `python 'C:\Users\Arthur Vequi\.codex\skills\webapp-testing\scripts\with_server.py' --server "npm run dev -- --host 127.0.0.1 --port 5174" --port 5174 --timeout 30 -- python tests/finance_ui_check.py`.
- Padrão de commits: tipo Conventional Commits em português (`feat:`, `fix:`, `style:`, `refactor:`, `chore:`), curtos e descritivos.

## Segurança e credenciais

Credenciais e tokens foram compartilhados no chat anterior; não copie valores para este arquivo, para commits ou para respostas. O usuário disse que pretende rotacioná-los. As variáveis antigas do Drive podem ainda existir nas configurações do projeto Vercel; código e API de Drive já foram removidos. Não imprima valores secretos ao inspecionar variáveis.
