# LifeSync — Gerenciador de Vida Pessoal

Plataforma completa de produtividade e organização pessoal construída com **arquitetura de microserviços**, **Domain-Driven Design (DDD)** e um frontend **React** moderno com visual Dark Mode premium.

---

## Visão Geral

O LifeSync unifica seis domínios da vida pessoal em um único ecossistema:

| Módulo | Descrição |
|--------|-----------|
| **Auth** | Registro, login e validação de sessão via JWT |
| **Goals** | Metas com categorização, prazos, Kanban e sub-tarefas (checklist) |
| **Habits** | Hábitos recorrentes com gamificação (XP, níveis) e streak tracker |
| **Finance** | Controle financeiro com parcelas de crédito, despesas fixas e investimentos |
| **Journal** | Diário de bordo com mood tracker e upsert diário |
| **Vault** | Cofre de conhecimento (notas e links) vinculável a metas |

---

## Arquitetura

```
lifesync-monorepo/
├── client/                  # Frontend React (Vite + Tailwind)
├── server/
│   ├── auth-service/        # :4000  →  MongoDB :27017
│   ├── goals-service/       # :4001  →  MongoDB :27018
│   ├── habits-service/      # :4002  →  MongoDB :27019
│   ├── finance-service/     # :4003  →  MongoDB :27020
│   ├── journal-service/     # :4004  →  MongoDB :27021
│   ├── vault-service/       # :4005  →  MongoDB :27022
│   ├── ai-service/          # :4006  →  MongoDB :27023
│   ├── calendar-service/    # :4007  →  MongoDB :27024
│   └── trip-service/        # :4008  →  MongoDB :27025
└── docker-compose.yml       # 9 instâncias MongoDB isoladas
```

Cada microserviço segue a mesma estrutura DDD interna:

```
src/
├── domain/
│   ├── entities/            # Entidades com lógica de negócio
│   └── repositories/        # Interfaces (contratos)
├── infrastructure/
│   ├── config/              # Variáveis de ambiente
│   └── persistence/
│       └── mongoose/        # Schemas e conexão MongoDB
├── application/
│   ├── dtos/                # Data Transfer Objects
│   ├── use-cases/           # Casos de uso (1 método público: execute)
│   └── result.ts            # Result Pattern (sem throw genérico)
└── presentation/
    └── http/
        ├── controllers/     # Express controllers
        ├── middlewares/      # AuthMiddleware (JWT standalone)
        └── createApp.ts     # Composição de rotas
```

### Princípios Aplicados

- **DDD (Domain-Driven Design)** — Entidades ricas com lógica de domínio, repositórios como contratos
- **Result Pattern** — Erros previsíveis via `Result<TValue, TError>` em vez de exceptions genéricas
- **Injeção de Dependência** — Use Cases recebem interfaces via construtor
- **Imutabilidade** — Entidades retornam novas instâncias em cada mutação
- **TypeScript Estrito** — Uso de `any` proibido, `unknown` com type assertions quando necessário

---

## Stack Tecnológica

### Backend

| Tecnologia | Função |
|------------|--------|
| **Node.js + TypeScript** | Runtime e linguagem |
| **Express 5** | Framework HTTP |
| **Mongoose** | ODM para MongoDB |
| **Zod** | Validação de schemas nos controllers |
| **jsonwebtoken** | Verificação de JWT (shared secret) |
| **Docker Compose** | Orquestração de instâncias MongoDB |

### Frontend

| Tecnologia | Função |
|------------|--------|
| **React 19** | UI framework |
| **Vite** | Build tool |
| **TypeScript** | Tipagem estrita |
| **Tailwind CSS** | Estilização utilitária (Dark Mode) |
| **TanStack Query** | Cache, fetching e estado assíncrono |
| **React Router DOM** | Roteamento SPA com layouts protegidos |
| **Zustand** | Estado global (auth store) |
| **Sonner** | Notificações toast |
| **Lucide React** | Ícones minimalistas |
| **date-fns** | Manipulação de datas |

---

## Pré-requisitos

- **Node.js** >= 18
- **npm** >= 9 (suporte a workspaces)
- **Docker** e **Docker Compose** (para as instâncias MongoDB)

---

## Instalação e Setup

### 1. Clonar e instalar dependências

```bash
git clone <url-do-repositorio>
cd project_manager_life
npm install
```

O monorepo usa **npm workspaces** — um único `npm install` na raiz instala tudo (client + todos os serviços).

### 2. Configurar variáveis de ambiente

Cada serviço tem um `.env.example`. Copie para `.env` em cada um:

```bash
# Exemplo para um serviço (repita para os 6)
cp server/auth-service/.env.example server/auth-service/.env
```

| Serviço | PORT | MongoDB URI | Database |
|---------|------|-------------|----------|
| auth-service | 4000 | `mongodb://localhost:27017/lifesync_auth` | lifesync_auth |
| goals-service | 4001 | `mongodb://localhost:27018/lifesync_goals` | lifesync_goals |
| habits-service | 4002 | `mongodb://localhost:27019/lifesync_habits` | lifesync_habits |
| finance-service | 4003 | `mongodb://localhost:27020/lifesync_finance` | lifesync_finance |
| journal-service | 4004 | `mongodb://localhost:27021/lifesync_journal` | lifesync_journal |
| vault-service | 4005 | `mongodb://localhost:27022/lifesync_vault` | lifesync_vault |
| ai-service | 4006 | `mongodb://localhost:27023/lifesync_ai` | lifesync_ai |
| calendar-service | 4007 | `mongodb://localhost:27024/lifesync_calendar` | lifesync_calendar |
| trip-service | 4008 | `mongodb://localhost:27025/lifesync_trips` | lifesync_trips |

Todos os serviços compartilham o mesmo `JWT_SECRET` para autenticação distribuída.

O `ai-service` ainda precisa das variáveis da OpenAI (veja `server/ai-service/.env.example`):

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `OPENAI_API_KEY` | — | Sem ela o serviço sobe normalmente, mas responde `AI_DISABLED` e o frontend esconde os botões de IA |
| `OPENAI_MODEL` | `gpt-5-mini` | Equilíbrio entre custo e confiabilidade em extração estruturada |
| `OPENAI_REASONING_EFFORT` | `low` | Deixe vazio ao usar modelos sem reasoning |
| `AI_MONTHLY_BUDGET_USD` | `2` | Teto de gasto estimado por usuário por mês |

O `calendar-service` precisa das credenciais do Google (veja `server/calendar-service/.env.example`):

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `GOOGLE_CLIENT_ID` | — | Client ID OAuth criado no Google Cloud. Sem ele o serviço sobe, mas a UI mostra "integração indisponível" |
| `GOOGLE_CLIENT_SECRET` | — | Client secret correspondente |
| `GOOGLE_REDIRECT_URI` | `http://localhost:3000/api/calendar/oauth/callback` | Precisa bater **exatamente** com o URI cadastrado no Google Cloud |
| `APP_URL` | `http://localhost:5173` | Para onde o usuário é redirecionado depois de autorizar |
| `TOKEN_ENCRYPTION_KEY` | — | Chave de 32 bytes em base64 (`openssl rand -base64 32`). Obrigatória quando o OAuth está configurado |
| `CALENDAR_TIMEZONE` | `America/Sao_Paulo` | Fuso usado ao criar eventos |

> Trocar a `TOKEN_ENCRYPTION_KEY` invalida os refresh tokens já salvos: todos os usuários
> precisam reconectar a conta Google.

### 3. Subir os bancos de dados

```bash
docker compose up -d
```

Isso cria 8 containers MongoDB isolados com volumes persistentes.

### 4. Rodar os serviços

Em terminais separados (ou usando um process manager):

```bash
# Backend (cada um em seu terminal)
npm run dev:auth
npm run dev:goals
npm run dev:habits
npm run dev:finance
npm run dev:journal
npm run dev:vault

# Frontend
npm run dev:client
```

O frontend estará disponível em `http://localhost:5173`.

---

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev:client` | Inicia o frontend (Vite dev server) |
| `npm run dev:auth` | Inicia o auth-service |
| `npm run dev:goals` | Inicia o goals-service |
| `npm run dev:habits` | Inicia o habits-service |
| `npm run dev:finance` | Inicia o finance-service |
| `npm run dev:journal` | Inicia o journal-service |
| `npm run dev:vault` | Inicia o vault-service |
| `npm run dev:ai` | Inicia o ai-service |
| `npm run dev:calendar` | Inicia o calendar-service |
| `npm run dev:trips` | Inicia o trip-service |
| `npm run build` | Compila o client e todos os serviços (é o que o deploy roda) |

---

## Deploy

O push na `main` dispara o workflow `.github/workflows/deploy.yml`, que entra na VPS por SSH e roda
`git pull --ff-only`, `npm install`, `npm run build` e reinicia os processos no PM2. O build vem
antes do restart de propósito: se a compilação quebrar, o deploy aborta e o que está no ar continua
sendo a versão anterior. Também é possível reenviar um deploy pelo botão *Run workflow*, sem
precisar de um commit novo.

O `pull` é `--ff-only` para o deploy **falhar** quando a VPS tiver alteração local, em vez de
descartar em silêncio o trabalho de alguém. Se isso acontecer, resolva a árvore de trabalho na VPS
antes de rodar de novo.

### Configuração no GitHub

Em *Settings → Secrets and variables → Actions*:

| Tipo | Nome | Conteúdo |
|------|------|----------|
| Secret | `VPS_HOST` | IP ou hostname da VPS |
| Secret | `VPS_USER` | Usuário do SSH |
| Secret | `VPS_SSH_KEY` | Chave privada inteira, incluindo as linhas `BEGIN`/`END` |
| Secret | `VPS_PORT` | Opcional, assume `22` |
| Variable | `PM2_APPS` | Nomes dos processos do LifeSync no PM2, separados por espaço |
| Variable | `VPS_APP_DIR` | Opcional, assume `/var/www/lifesync` |

O `PM2_APPS` é listado nome por nome, e não `pm2 restart all`, porque a VPS hospeda outros
projetos que não têm nada a ver com um deploy do LifeSync. Rode `pm2 ls` para pegar os nomes. O
workflow falha com mensagem explícita se essa variável não estiver configurada.

A chave em `VPS_SSH_KEY` precisa ter a pública correspondente no `~/.ssh/authorized_keys` da VPS.

### Serviço novo no ar pela primeira vez

O workflow cuida de código, mas não de infraestrutura. Um serviço recém-criado precisa, uma única
vez na VPS: subir o container do Mongo dele (`docker compose up -d mongo-<nome>`), criar o `.env` a
partir do `.env.example` com o **mesmo** `JWT_SECRET` dos outros, acrescentar a URL dele no `.env`
do `api-gateway`, e registrar no PM2 com `pm2 start … --name … && pm2 save`.

---

## Endpoints da API

### Paginação

Todas as rotas de listagem são paginadas. Elas aceitam `?page=` (1-based, padrão `1`) e
`?pageSize=` (padrão `20`, máximo `100`), e respondem com a lista sob a chave do recurso mais
um bloco `pagination`:

```json
{
  "notes": [],
  "pagination": { "page": 1, "pageSize": 20, "total": 57, "hasMore": true }
}
```

Valores inválidos de paginação retornam `400 INVALID_QUERY`. Nos endpoints financeiros, os
totais (`totalIncome`, `totalExpense`, `balance`, `totalInvested`, `totalBalance`) são
agregados no banco e refletem o período inteiro, não a página carregada.

### Auth Service (`:4000`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/register` | Registro de usuário |
| POST | `/auth/login` | Login (retorna JWT) |
| GET | `/auth/me` | Dados do usuário autenticado |

### Goals Service (`:4001`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/goals` | Criar meta |
| GET | `/goals` | Listar metas (filtros `?category=` e `?status=` aceitando lista separada por vírgula) |
| PATCH | `/goals/:id` | Atualizar meta |
| DELETE | `/goals/:id` | Excluir meta |
| POST | `/goals/:id/tasks` | Adicionar sub-tarefa |
| PATCH | `/goals/:id/tasks/:taskId/toggle` | Marcar/desmarcar sub-tarefa |
| DELETE | `/goals/:id/tasks/:taskId` | Remover sub-tarefa |

### Habits Service (`:4002`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/habits` | Criar hábito |
| GET | `/habits` | Listar hábitos (com streak e XP) |
| PATCH | `/habits/:id` | Atualizar dados do hábito |
| PATCH | `/habits/:id/toggle` | Check-in/uncheck de data |
| DELETE | `/habits/:id` | Excluir hábito |

### Finance Service (`:4003`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/transactions` | Criar transação (suporta parcelas e fixas) |
| GET | `/transactions/summary` | Resumo financeiro (saldo, receitas, despesas) |
| DELETE | `/transactions/:id` | Excluir transação |
| POST | `/investments` | Criar investimento |
| GET | `/investments` | Listar investimentos |
| PATCH | `/investments/:id/balance` | Atualizar saldo do investimento |
| DELETE | `/investments/:id` | Excluir investimento |

### Journal Service (`:4004`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/journal` | Salvar/atualizar entrada do dia (upsert) |
| GET | `/journal/today?date=YYYY-MM-DD` | Buscar entrada de uma data |
| GET | `/journal/month/:year/:month` | Histórico mensal |

### Vault Service (`:4005`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/vault` | Criar nota |
| GET | `/vault` | Listar notas (veja os filtros abaixo) |
| GET | `/vault/tags` | Tags do usuário com contagem de uso |
| PATCH | `/vault/:id` | Atualizar nota (aceita alteração parcial) |
| DELETE | `/vault/:id` | Excluir nota |

Cada nota tem um **formato** (`type`: `NOTE`, `LINK`, `SNIPPET`, `CHECKLIST`), uma **categoria**
(`category`: `IDEA`, `REFERENCE`, `LEARNING`, `PROJECT`, `INSPIRATION`, `OTHER`) e um **estágio de
maturidade** (`stage`: `SEED`, `EXPLORING`, `VALIDATED`, `DONE`, `DISCARDED`), além de `tags`,
`summary`, `sourceUrl`, `isFavorite` e `isArchived`.

`GET /vault` aceita, junto da paginação: `search` (busca textual em título, resumo e conteúdo,
ordenada por relevância), `type`, `category`, `stage`, `goalId`, `tags` (lista separada por
vírgula, exigindo todas), `onlyFavorites` e `includeArchived`. Notas arquivadas ficam fora da
listagem por padrão.

### AI Service (`:4006`)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/ai/finance/parse` | Interpreta uma frase em rascunhos de transação |
| POST | `/ai/vault/suggest` | Sugere resumo, tags, categoria e estágio para uma nota |
| GET | `/ai/usage` | Consumo do mês, teto de gasto e se a IA está habilitada |

A IA **nunca grava dados**. `POST /ai/finance/parse` devolve rascunhos com um campo `confidence`;
o usuário revisa na interface e a gravação segue pelo `POST /transactions` normal. Cada chamada é
registrada em `lifesync_ai` com tokens e custo estimado, e o serviço recusa novas chamadas
(`AI_BUDGET_EXCEEDED`, HTTP 429) quando o usuário passa de `AI_MONTHLY_BUDGET_USD` no mês.

### Calendar Service (`:4007`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/calendar/connection` | Status da conexão Google (conectado, e-mail, se a integração está disponível) |
| POST | `/calendar/connection/start` | Devolve a URL de consentimento do Google |
| GET | `/calendar/oauth/callback` | Callback chamado pelo Google — **rota pública** |
| DELETE | `/calendar/connection` | Desconecta a conta e apaga o refresh token |
| GET | `/calendar/events?start=&end=` | Eventos do intervalo, lidos ao vivo da API do Google |
| POST | `/calendar/events` | Cria um evento na agenda principal |
| PATCH | `/calendar/events/:id` | Edita um evento (`start` e `end` devem vir juntos) |
| DELETE | `/calendar/events/:id` | Remove um evento |

Eventos **não são replicados** no MongoDB: a fonte da verdade é o Google Agenda e cada
requisição consulta a API na hora. A única coisa persistida em `lifesync_calendar` é o refresh
token, cifrado com AES-256-GCM. O access token fica em cache em memória até expirar.

O callback é público porque quem o chama é o Google, sem header de autenticação — a identidade
do usuário vem do parâmetro `state`, um JWT de 10 minutos assinado com o `JWT_SECRET` e marcado
com um `purpose` próprio para não ser confundido com um token de sessão.

**Configuração no Google Cloud:** habilite a Google Calendar API, publique a tela de consentimento
em produção (em modo de teste o refresh token expira em 7 dias), adicione o escopo
`.../auth/calendar` e cadastre o redirect URI exatamente igual ao `GOOGLE_REDIRECT_URI`.

### Trip Service (`:4008`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/trips?page=&pageSize=&includeArchived=` | Lista viagens com contadores de progresso |
| POST | `/trips` | Cria uma viagem |
| GET | `/trips/:id` | Viagem completa, com bagagem, pendências, reservas e roteiro |
| PATCH | `/trips/:id` | Edita dados da viagem ou arquiva |
| DELETE | `/trips/:id` | Remove a viagem e tudo que está nela |
| POST | `/trips/:id/packing` | Adiciona item de bagagem |
| PATCH | `/trips/:id/packing/:itemId` | Edita o item (marcar "já guardei" é um PATCH com `isPacked`) |
| DELETE | `/trips/:id/packing/:itemId` | Remove item de bagagem |
| POST | `/trips/:id/checklist` | Adiciona pendência |
| PATCH | `/trips/:id/checklist/:itemId` | Edita a pendência ou marca como resolvida |
| DELETE | `/trips/:id/checklist/:itemId` | Remove pendência |
| POST | `/trips/:id/reservations` | Adiciona reserva (voo, hospedagem, transporte, atividade) |
| PATCH | `/trips/:id/reservations/:itemId` | Edita a reserva |
| DELETE | `/trips/:id/reservations/:itemId` | Remove reserva |
| POST | `/trips/:id/itinerary` | Adiciona item ao roteiro |
| PATCH | `/trips/:id/itinerary/:itemId` | Edita o item do roteiro |
| DELETE | `/trips/:id/itinerary/:itemId` | Remove item do roteiro |

Bagagem, pendências, reservas e roteiro ficam **embutidos no documento da viagem**, como as
sub-tarefas em `goals-service`: uma requisição entrega a tela inteira, o que importa quando a
conexão é ruim durante a viagem. Por isso as sub-listas não paginam — só a listagem de viagens
pagina.

Reservas e roteiro guardam data e hora como **texto sem fuso** (`YYYY-MM-DDTHH:mm` e `HH:mm`).
Um voo às 08:30 é às 08:30 no aeroporto, independente do fuso do aparelho que abrir o app — por
isso não faz sentido converter para UTC aqui, ao contrário do `calendar-service`.

Toda mutação devolve a viagem inteira, então o cache do client fica consistente sem refetch.
A fase da viagem (planejando, em andamento, concluída) é derivada das datas no client, em vez de
um campo de status que ficaria desatualizado sem alguém marcar a mudança.

> Todas as rotas (exceto register/login e o callback OAuth) exigem header `Authorization: Bearer <token>`.

---

## Frontend — Páginas e Funcionalidades

### Contextos (workspaces)

Um seletor centralizado no topo do header troca o escopo do app inteiro, no estilo dos bancos que
separam PF de PJ. Hoje existem dois contextos:

| Contexto | Navegação |
|----------|-----------|
| **Pessoal** | Home, Metas, Hábitos, Finanças, Agenda, Evolução, Cofre |
| **Viagens** | Lista de viagens e, dentro de uma, Bagagem, Pendências, Reservas e Roteiro |

A rota atual é quem decide o contexto — um link salvo em `/viagens` nunca abre com a navegação do
contexto pessoal. O `workspaceStore` (`@lifesync:workspace`) só guarda a preferência entre sessões.
Assim a viagem não disputa espaço com metas e hábitos na barra inferior do PWA.

#### Tema por contexto

Cada contexto tem seu próprio ambiente visual: **Pessoal é azul sobre navy** e **Viagens é âmbar
sobre um fundo quente**. Trocar de contexto muda acento, fundo, bordas e até a cor da barra de
status no PWA instalado, com o conteúdo entrando numa animação curta — a ideia é parecer que o app
trocou de ambiente, não só de abas.

As telas usam os tokens `accent-*`, `surface-*` e `edge` em vez de uma cor fixa. Como as utilities
do Tailwind v4 compilam para `var(--color-…)`, o `useWorkspaceTheme` só precisa escrever
`data-workspace` no `<html>` e o app inteiro se repinta, sem componente nenhum saber qual contexto
está ativo.

Detalhes que essa montagem exige:

- Os valores das paletas são **literais** no `index.css`, não `var(--color-blue-*)`. O Tailwind v4
  só emite as variáveis da paleta que encontra em uso, então apontar para elas faria o tema
  depender de alguma outra tela continuar usando aquela cor.
- O padrão dos tokens é exatamente o azul de antes, então toda tela que ainda não migrou continua
  correta no contexto pessoal — só o que é alcançável dentro de `/viagens` precisou migrar.
- O acento carrega seu próprio primeiro plano (`--color-accent-fg`), porque o âmbar é claro demais
  para texto branco em cima. Em viagens os botões preenchidos usam texto escuro.
- A fase da viagem não usa âmbar nem vermelho: âmbar virou a cor do contexto e vermelho significa
  atraso, então a proximidade é comunicada por brilho, sobrando o verde para "em andamento".
- O atributo vai no `<html>` (e não no shell React) para o overscroll do iOS e os modais em portal
  herdarem o contexto. A animação respeita `prefers-reduced-motion`.

### Dashboard (`/`)
- Cockpit central com Bento Grid
- Painel de finanças (saldo, receitas, despesas)
- Painel de hábitos do dia (check visual + streak)
- Painel de metas ativas
- **Daily Check-In** do diário com seletor de humor (5 emojis)

### Metas (`/goals`)
- Kanban com 3 colunas: Pendentes, Em Andamento, Concluídas
- Filtro por categoria (Estudos, Pessoal, Empresarial, Familiar, Sonhos)
- Cards com badge de categoria, indicador de prazo (atrasada/urgente/normal)
- Sub-tarefas com checklist, barra de progresso e criação inline
- Formulário de criação com categoria e prazo obrigatórios

### Hábitos (`/habits`)
- Cards com botão circular de check-in diário
- Barra de XP e badge de nível (gamificação: +10 XP por check-in, level up a cada 100 XP)
- Weekly Tracker (7 círculos representando a semana)
- Streak com ícone de fogo
- Menu dropdown (editar/excluir) com modal de edição
- Estatística de total de check-ins
- Toast especial com troféu ao subir de nível

### Finanças (`/finance`)
- Abas: Visão Geral e Investimentos
- Suporte a cartão de crédito com parcelas automáticas
- Despesas/receitas fixas com projeção anual (12 meses)
- Cards de resumo (saldo, receitas, despesas)
- Seções separadas: Receitas, Despesas Fixas, Despesas Variáveis
- Gestão de investimentos com cálculo de lucro/prejuízo

### Cofre (`/vault`)
- Grid responsivo de notas e links
- Dois tipos: Anotação (ícone documento) e Link (ícone externo, clicável)
- Vínculo opcional com metas (badge Target verde)
- Modal de criação com select de metas ativas do usuário

### Agenda (`/agenda`)
- Conexão com a conta Google via OAuth, com explicação do que será acessado
- Visão semanal navegável, com eventos agrupados por dia e destaque para hoje
- Criação, edição e remoção de eventos (com ou sem hora), refletidos direto no Google Agenda
- Link para abrir cada evento no Google e botão para desconectar a conta

### Viagens (`/viagens`)
- Lista de viagens com destino, período, fase derivada das datas e progresso de bagagem/pendências
- Arquivar viagens passadas sem apagá-las, com filtro para voltar a mostrá-las
- **Bagagem** (`/viagens/:id/bagagem`) — itens agrupados por categoria, com quantidade e check de
  "já guardei"; a marcação é otimista, para responder na hora mesmo com conexão ruim
- **Pendências** (`/viagens/:id/pendencias`) — tarefas pré-viagem com prazo opcional, ordenadas pelo
  prazo mais próximo e com destaque para as atrasadas
- **Reservas** (`/viagens/:id/reservas`) — voo, hospedagem, transporte e atividades num só lugar,
  com empresa, endereço, link e código de confirmação copiável com um toque (é o que se precisa no
  balcão do check-in); sem data vão para o fim da lista
- **Roteiro** (`/viagens/:id/roteiro`) — agrupado por dia e ordenado pela hora, com hora opcional
  para quando só se sabe o que fazer, não quando

### Política de Privacidade (`/privacidade`)
- Página pública (acessível logado ou não), exigida pela verificação do Google OAuth

---

## Segurança

- **JWT compartilhado** — Todos os microserviços validam tokens usando o mesmo `JWT_SECRET`, sem acessar o banco do auth-service
- **Ownership validation** — Todos os Use Cases verificam se o `userId` do token corresponde ao dono do recurso antes de qualquer mutação
- **Zod validation** — Todos os bodies de request são validados na camada de apresentação
- **Tokens no localStorage** — Injetados automaticamente em todas as requisições via `apiRequest`
- **Refresh token do Google cifrado** — Guardado com AES-256-GCM; um vazamento do banco sozinho não dá acesso à agenda do usuário
- **State OAuth assinado** — O callback do Google é público, então a identidade vem de um JWT curto e com `purpose` dedicado

---

## Estrutura do Monorepo

```
project_manager_life/
├── .cursorrules              # Regras de código para a IA
├── docker-compose.yml        # 8 MongoDB containers
├── package.json              # Workspace root (npm workspaces)
├── client/                   # React + Vite + Tailwind
│   └── src/
│       ├── api/              # Funções HTTP por serviço
│       ├── hooks/            # TanStack Query hooks
│       ├── components/       # Componentes reutilizáveis
│       ├── layouts/          # AuthLayout, PublicLayout
│       ├── pages/            # Páginas de rota
│       ├── stores/           # Zustand (auth)
│       └── App.tsx           # Router config
└── server/
    ├── auth-service/
    ├── goals-service/
    ├── habits-service/
    ├── finance-service/
    ├── journal-service/
    ├── vault-service/
    ├── ai-service/
    ├── calendar-service/
    └── trip-service/
```
