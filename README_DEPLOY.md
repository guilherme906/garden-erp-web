# 📦 Guias de Deploy - Garden ERP Web

Este projeto pode ser hospedado em várias plataformas. Escolha a que melhor se adequa às suas necessidades.

## 🎯 Recomendação Rápida

| Necessidade | Plataforma | Custo | Dificuldade |
|---|---|---|---|
| **Full-stack simples** | Railway | $10-20/mês | ⭐ Fácil |
| **Máximo controle** | Docker + VPS | $5-12/mês | ⭐⭐ Médio |
| **Frontend apenas** | Vercel | Gratuito | ⭐ Fácil |
| **Escala grande** | AWS | Variável | ⭐⭐⭐ Difícil |

---

## 📚 Guias de Deploy

### 1. **Railway** (Recomendado) ⭐
**Melhor para:** Iniciar rápido com full-stack

- ✅ Node.js + Express + React
- ✅ MySQL/PostgreSQL incluído
- ✅ Deploy automático via GitHub
- ✅ Preço justo (~$10-15/mês)

👉 [Ver guia completo](./DEPLOY_RAILWAY.md)

---

### 2. **Docker + VPS**
**Melhor para:** Máximo controle e customização

- ✅ Funciona em qualquer VPS
- ✅ DigitalOcean, Linode, AWS, etc
- ✅ Full-stack containerizado
- ✅ Escalável

👉 [Ver guia completo](./DEPLOY_DOCKER.md)

---

### 3. **Vercel** (Frontend Only)
**Melhor para:** Frontend rápido e gratuito

- ✅ Deploy automático
- ✅ CDN global
- ✅ HTTPS grátis
- ⚠️ Backend precisa estar em outro lugar

👉 [Ver guia completo](./DEPLOY_VERCEL.md)

---

## 🚀 Quick Start - Railway (Recomendado)

### Passo 1: Preparar Repositório GitHub

```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Passo 2: Conectar Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em "New Project" → "Deploy from GitHub"
3. Selecione seu repositório
4. Clique em "Deploy"

### Passo 3: Configurar Variáveis

No painel do Railway:
1. Vá para "Variables"
2. Copie as variáveis de [RAILWAY_ENV_TEMPLATE.txt](./RAILWAY_ENV_TEMPLATE.txt)
3. Adicione suas credenciais reais

### Passo 4: Criar Banco de Dados

1. Clique em "+ New"
2. Selecione "MySQL"
3. Railway criará automaticamente `DATABASE_URL`

### Passo 5: Deploy Automático

Railway fará automaticamente:
- ✅ Build: `pnpm install && pnpm build`
- ✅ Start: `npm run start`
- ✅ Deploy em produção

---

## 📋 Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] Código está no GitHub
- [ ] `package.json` tem script `start`
- [ ] `Procfile` existe
- [ ] `railway.json` está configurado
- [ ] Todas as variáveis de ambiente estão prontas
- [ ] Banco de dados está acessível
- [ ] Build local funciona: `pnpm build && npm run start`

---

## 🔐 Variáveis de Ambiente Necessárias

### Obrigatórias:
```
DATABASE_URL=mysql://usuario:senha@host:3306/banco
JWT_SECRET=sua_chave_secreta
NODE_ENV=production
PORT=3000
```

### OAuth (Manus):
```
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=seu_nome
```

### Storage (AWS S3):
```
AWS_ACCESS_KEY_ID=sua_chave
AWS_SECRET_ACCESS_KEY=sua_chave_secreta
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu_bucket
```

### APIs (Manus):
```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua_chave
```

---

## 🆘 Troubleshooting

### Build falha
- Verifique `package.json` e dependências
- Consulte logs de build na plataforma
- Teste localmente: `pnpm build`

### App não inicia
- Verifique variáveis de ambiente
- Verifique conexão com banco de dados
- Consulte logs de runtime

### Banco de dados não conecta
- Verifique `DATABASE_URL`
- Teste conexão localmente
- Verifique firewall/segurança

---

## 📞 Suporte

- **Railway:** [docs.railway.app](https://docs.railway.app)
- **Docker:** [docs.docker.com](https://docs.docker.com)
- **Vercel:** [vercel.com/docs](https://vercel.com/docs)

---

**Próximas etapas após deploy:**
1. Configurar domínio customizado
2. Configurar SSL (geralmente automático)
3. Configurar backups automáticos
4. Monitorar logs e performance
5. Configurar CI/CD para atualizações automáticas

---

**Dúvidas?** Consulte os guias específicos acima ou a documentação das plataformas.
