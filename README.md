# LARY AI

**Sistema de Inteligência Artificial aplicado à Construção Civil.**

---

| Campo | Valor |
|-------|-------|
| **Estado** | Desenvolvimento |
| **Maturidade** | 2 / 5 |
| **Tier** | Produto |
| **Categoria** | 02_APPS |

## Estrutura

```
lary-ai/
├── specs/                          ← Requisitos funcionais
├── docs/
│   ├── dashboard/                  ← Kanban + Roadmap + Decisões + Riscos
│   ├── prototipo-mvp/              ← Protótipo navegável (5 telas)
│   └── validacao/                  ← Roteiro de entrevistas + Termo LGPD
├── backend/                        ← API Node.js + Express + TypeScript
│   └── src/
│       ├── routes/                 ← CRUD RDO + Health
│       ├── ai/                     ← Extração com OpenAI (confiança estimada)
│       ├── db/                     ← Schema PostgreSQL + conexão
│       └── middleware/             ← Validação (Zod) + Auditoria + Erros
├── frontend/                       ← React Native + Expo
│   └── src/
│       ├── screens/                ← 5 telas do fluxo MVP
│       ├── hooks/                  ← Offline-first sync
│       └── services/               ← API client
├── tests/                          ← Playwright (aceitação)
├── docker-compose.yml              ← Postgres + Redis + MinIO + Backend
└── .env.example
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| **Mobile** | React Native, Expo, WatermelonDB |
| **Backend** | Node.js, Express, TypeScript |
| **Banco** | PostgreSQL, TimescaleDB |
| **IA** | OpenAI GPT-4o mini |
| **Cache** | Redis |
| **Storage** | MinIO (S3-compatible) |
| **Infra** | Docker Compose / Supabase |

## Rodar localmente

```bash
# Backend
cd backend
cp ../.env.example .env   # configurar OPENAI_API_KEY
npm install
npm run dev

# Frontend
cd frontend
npm install
npx expo start

# Infra completa
docker compose up -d
```

## MVP (5 histórias)

1. Mestre registra apontamento com foto + texto (offline)
2. IA extrai metadados e sugere complementos (com confiança estimada)
3. Engenheiro revisa, ajusta e aprova (com clique explícito)
4. Sistema gera RDO PDF com hash SHA-256 + audit trail
5. Exportação CSV para alimentar sistemas legados
