# 🧠 LifeSync - Arquitetura e Regras de Negócio

## 🎯 Visão do Produto
LifeSync é um sistema de gestão pessoal (Metas, Hábitos e Finanças). O foco é alta performance, disponibilidade e dados precisos para o usuário final.

## 🏗️ Topologia da Arquitetura
- **Frontend (`/client`):** SPA em React, TypeScript, Vite, TailwindCSS. Comunicação via RESTful APIs.
- **Backend (`/server`):** Ecossistema de Microserviços em Node.js (TypeScript).
- **Banco de Dados:** Padrão "Database-per-service". Cada microserviço possui sua própria instância/database no MongoDB isolada.

## 🧱 Padrão de Código Backend: Domain-Driven Design (DDD) Isolado
Cada serviço dentro de `/server` (ex: `/server/auth-service`) DEVE seguir as 4 camadas estritas:
1. **Domain:** Entidades, Value Objects e Domain Errors. NENHUMA dependência externa é permitida aqui (nem Mongoose, nem Express).
2. **Application:** Use Cases e DTOs. Orquestra a lógica de domínio usando injeção de dependência.
3. **Infrastructure:** Repositórios concretos (Mongoose Schemas), integrações externas e criptografia (Bcrypt/JWT).
4. **Presentation:** Controllers, Middlewares de validação e Rotas REST (Express/Fastify).

## 🔒 Regras de Comunicação e Segurança
- **Autenticação:** O `auth-service` é o único emissor de JWT. Os outros serviços validam a assinatura do JWT de forma Stateless (usando a mesma chave pública/secreta) via middleware.
- **Isolamento de Dados:** Um microserviço NUNCA faz queries direto no banco de outro. Se o `finance-service` precisar de dados do usuário, ele deve fazer uma chamada HTTP (ou mensageria) para o `auth-service`.
- **Tenancy:** Todo dado criado no sistema pertence a um usuário. O `userId` extraído do JWT deve ser passado até a camada de infraestrutura.