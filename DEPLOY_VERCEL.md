# ⚡ Deploy Frontend em Vercel

## Opção 1: Deploy Automático via GitHub

### 1. Conectar Repositório

1. Acesse [vercel.com](https://vercel.com)
2. Clique em **"New Project"**
3. Selecione **"Import Git Repository"**
4. Autorize e selecione `garden-erp-web`

### 2. Configurar Build

Vercel detectará automaticamente:
- **Framework:** Vite
- **Build Command:** `pnpm build`
- **Output Directory:** `dist/public`

### 3. Adicionar Variáveis de Ambiente

No painel do Vercel, vá para **"Settings"** → **"Environment Variables"**

```
VITE_APP_ID=seu_app_id
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua_chave
```

### 4. Deploy

Clique em **"Deploy"** e aguarde a conclusão.

---

## ⚠️ Importante: Backend Separado

Este método deploy apenas o **frontend** em Vercel. O **backend** precisa estar em outro lugar:

- **Opção A:** Railway (recomendado)
- **Opção B:** Docker em VPS
- **Opção C:** DigitalOcean App Platform
- **Opção D:** AWS Elastic Beanstalk

---

## Configurar API Backend

Após fazer deploy do backend em outro servidor, atualize a variável:

```
VITE_API_URL=https://seu-backend.railway.app
```

---

**Referências:**
- [Vercel Docs](https://vercel.com/docs)
- [Deploy Vite em Vercel](https://vercel.com/docs/frameworks/vite)
