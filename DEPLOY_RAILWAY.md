# 🚀 Guia de Deploy no Railway

## Pré-requisitos

1. **Conta Railway** - Criar em [railway.app](https://railway.app)
2. **GitHub** - Repositório com o código do projeto
3. **Variáveis de Ambiente** - Preparadas para Railway

## Passo 1: Conectar Repositório GitHub

1. Acesse [railway.app](https://railway.app)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub"**
4. Autorize o Railway a acessar seu GitHub
5. Selecione o repositório `garden-erp-web`
6. Clique em **"Deploy"**

## Passo 2: Configurar Variáveis de Ambiente

No painel do Railway, acesse **"Variables"** e adicione:

### Variáveis Obrigatórias:

```
DATABASE_URL=mysql://usuario:senha@host:3306/garden_erp
JWT_SECRET=sua_chave_secreta_aqui
NODE_ENV=production
PORT=3000
```

### Variáveis OAuth (Manus):

```
VITE_APP_ID=seu_app_id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=seu_nome
```

### Variáveis de Storage (S3/AWS):

```
AWS_ACCESS_KEY_ID=sua_chave_acesso
AWS_SECRET_ACCESS_KEY=sua_chave_secreta
AWS_REGION=us-east-1
AWS_S3_BUCKET=seu_bucket_name
```

### Variáveis de API (Manus Built-in):

```
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend
```

## Passo 3: Banco de Dados

### Opção A: MySQL no Railway (Recomendado)

1. No painel do Railway, clique em **"+ New"**
2. Selecione **"MySQL"**
3. Railway criará automaticamente a variável `DATABASE_URL`
4. Copie a URL e use no seu projeto

### Opção B: MySQL Externo

Se você já tem um MySQL em outro servidor:

1. Obtenha a URL de conexão: `mysql://usuario:senha@host:porta/banco`
2. Adicione como variável `DATABASE_URL`

## Passo 4: Deploy Automático

O Railway detectará automaticamente:

- ✅ `package.json` - Identifica Node.js
- ✅ `Procfile` - Usa comando de start
- ✅ `railway.json` - Configurações específicas
- ✅ Build automático com `pnpm install && pnpm build`
- ✅ Start automático com `npm run start`

## Passo 5: Verificar Deploy

1. Acesse o painel do Railway
2. Vá para **"Deployments"**
3. Acompanhe o build em tempo real
4. Após conclusão, copie a URL pública (ex: `https://seu-projeto.railway.app`)

## Troubleshooting

### Erro: "Build failed"

**Solução:**
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique se o `DATABASE_URL` está correto
- Consulte os logs: **"Logs"** → **"Build Logs"**

### Erro: "Application crashed"

**Solução:**
- Verifique os logs de runtime: **"Logs"** → **"Runtime Logs"**
- Certifique-se de que o banco de dados está acessível
- Verifique se todas as migrations foram aplicadas

### Erro: "Cannot find module"

**Solução:**
- Limpe o cache: **"Settings"** → **"Redeploy"**
- Verifique se todas as dependências estão no `package.json`

## Próximas Etapas

1. **Domínio Customizado** - Railway → Settings → Domains
2. **SSL Automático** - Railway fornece HTTPS gratuitamente
3. **Monitoramento** - Railway → Monitoring
4. **Backups** - Configure backups automáticos do banco de dados

## Referências

- [Documentação Railway](https://docs.railway.app)
- [Deploy Node.js no Railway](https://docs.railway.app/guides/nodejs)
- [Variáveis de Ambiente](https://docs.railway.app/develop/variables)

---

**Dúvidas?** Consulte a documentação do Railway ou entre em contato com o suporte.
