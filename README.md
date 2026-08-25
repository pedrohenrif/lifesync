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
│   └── ai-service/          # :4006  →  MongoDB :27023
└── docker-compose.yml       # 7 instâncias MongoDB isoladas
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

Todos os serviços compartilham o mesmo `JWT_SECRET` para autenticação distribuída.

O `ai-service` ainda precisa das variáveis da OpenAI (veja `server/ai-service/.env.example`):

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `OPENAI_API_KEY` | — | Sem ela o serviço sobe normalmente, mas responde `AI_DISABLED` e o frontend esconde os botões de IA |
| `OPENAI_MODEL` | `gpt-5-mini` | Equilíbrio entre custo e confiabilidade em extração estruturada |
| `OPENAI_REASONING_EFFORT` | `low` | Deixe vazio ao usar modelos sem reasoning |
| `AI_MONTHLY_BUDGET_USD` | `2` | Teto de gasto estimado por usuário por mês |

### 3. Subir os bancos de dados

```bash
docker compose up -d
```

Isso cria 6 containers MongoDB isolados com volumes persistentes.

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

> Todas as rotas (exceto register/login) exigem header `Authorization: Bearer <token>`.

---

## Frontend — Páginas e Funcionalidades

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

---

## Segurança

- **JWT compartilhado** — Todos os microserviços validam tokens usando o mesmo `JWT_SECRET`, sem acessar o banco do auth-service
- **Ownership validation** — Todos os Use Cases verificam se o `userId` do token corresponde ao dono do recurso antes de qualquer mutação
- **Zod validation** — Todos os bodies de request são validados na camada de apresentação
- **Tokens no localStorage** — Injetados automaticamente em todas as requisições via `apiRequest`

---

## Estrutura do Monorepo

```
project_manager_life/
├── .cursorrules              # Regras de código para a IA
├── docker-compose.yml        # 6 MongoDB containers
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
    └── ai-service/
```
