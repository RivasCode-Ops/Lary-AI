# 🚂 LARY AI — Deploy no Railway

## Pré-requisitos

- [ ] Conta no [Railway](https://railway.app) (GitHub login)
- [ ] Código no GitHub (ou upload direto via `railway up`)
- [ ] Chave OpenAI (`sk-...`)

---

## 1. Criar Projeto no Railway

```bash
# Opção A: CLI (recomendado)
npm install -g @railway/cli
railway login
railway init

# Opção B: Dashboard
# 1. Acessar https://railway.app/new
# 2. Selecionar "Deploy from GitHub repo"
# 3. Conectar o repositório
# 4. Definir Root Directory como "backend"
```

---

## 2. Adicionar PostgreSQL

No dashboard do Railway:

1. **Add Plugin → Database → PostgreSQL**
2. Aguardar provisionamento (30s)
3. Copiar a `DATABASE_URL` gerada (ex: `postgresql://postgres:abc@xyz.up.railway.app:5432/railway`)

---

## 3. Configurar Variáveis de Ambiente

No dashboard, em **Variables**:

| Nome | Valor | Obrigatório |
|------|-------|-------------|
| `DATABASE_URL` | (copiado do PostgreSQL plugin) | ✅ |
| `OPENAI_API_KEY` | `sk-sua-chave-aqui` | ✅ |
| `JWT_SECRET` | `gerar-uma-senha-forte-aqui` | ✅ |
| `JWT_EXPIRES_IN` | `7d` | |
| `CORS_ORIGIN` | `*` | |
| `PORT` | `3001` | |

---

## 4. Deploy

Se conectado via GitHub:

- Push para o branch principal → deploy automático
- Ou clique em **Deploy** no dashboard

Se usando CLI:

```bash
railway up
```

Verificar status:

```bash
railway logs
# Deve mostrar: [LARY AI] API running on port 3001
```

---

## 5. Health Check

Testar se o backend está no ar:

```bash
# Substituir pela URL gerada pelo Railway
curl https://lary-ai-backend.up.railway.app/health

# Resposta esperada:
# {"service":"LARY AI","version":"0.1.0","status":"healthy","checks":{"database":"ok","openai":"configured"}}
```

---

## 6. Inicializar Banco de Dados

A primeira vez que o backend iniciar, ele executa `init.sql` automaticamente (cria as 8 tabelas).

Para popular com dados de teste:

```bash
railway run npx tsx src/db/seed.ts
```

Credenciais de teste:

| Perfil | Email | Senha |
|--------|-------|-------|
| Admin | admin@lary.ai | admin123 |
| Mestre | mestre@obra.com | 123456 |
| Engenheiro | engenheiro@obra.com | 123456 |

---

## 7. Conectar o Frontend

Antes de iniciar o Expo, atualizar o .env:

```bash
# frontend/.env
EXPO_PUBLIC_API_URL=https://lary-ai-backend.up.railway.app
```

```bash
cd frontend && npx expo start --tunnel
```

Escaneie o QR code com o celular.

---

## 8. Resolução de Problemas

| Problema | Causa | Solução |
|----------|-------|---------|
| 503 no /health | Banco não conectou | Verificar DATABASE_URL |
| init.sql não rodou | Tabelas já existem | Ignorar (warning) |
| OpenAI 401 | OPENAI_API_KEY inválida | Verificar chave |
| CORS no celular | CORS_ORIGIN restrito | Mudar para `*` |
| 502 bad gateway | Porta errada | Definir PORT=3001 |

---

## Arquivos de Configuração

- `backend/railway.json` — Configuração do build/deploy Railway
- `backend/package.json` — Scripts `build` e `start`
- `backend/Dockerfile.prod` — Alternativa para Docker no Railway
