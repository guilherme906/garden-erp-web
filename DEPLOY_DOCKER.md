# 🐳 Deploy com Docker

## Opção 1: Docker Local

### Build da Imagem

```bash
docker build -t garden-erp:latest .
```

### Executar Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/garden_erp" \
  -e JWT_SECRET="sua_chave_secreta" \
  -e NODE_ENV="production" \
  garden-erp:latest
```

## Opção 2: Docker Compose

### Criar arquivo `docker-compose.yml`

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mysql://root:password@db:3306/garden_erp
      - JWT_SECRET=sua_chave_secreta
      - PORT=3000
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=password
      - MYSQL_DATABASE=garden_erp
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

volumes:
  mysql_data:
```

### Executar

```bash
docker-compose up -d
```

## Opção 3: Deploy em VPS com Docker

### 1. SSH no servidor

```bash
ssh root@seu_servidor.com
```

### 2. Instalar Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### 3. Clonar repositório

```bash
git clone https://github.com/seu_usuario/garden-erp-web.git
cd garden-erp-web
```

### 4. Criar arquivo `.env`

```bash
cat > .env << EOF
DATABASE_URL=mysql://root:password@db:3306/garden_erp
JWT_SECRET=sua_chave_secreta
NODE_ENV=production
PORT=3000
EOF
```

### 5. Executar com Docker Compose

```bash
docker-compose up -d
```

### 6. Verificar status

```bash
docker-compose ps
docker-compose logs app
```

## Troubleshooting

### Container não inicia

```bash
docker-compose logs app
```

### Banco de dados não conecta

```bash
docker-compose exec app npm run db:push
```

### Limpar tudo

```bash
docker-compose down -v
```

---

**Referências:**
- [Docker Docs](https://docs.docker.com)
- [Docker Compose](https://docs.docker.com/compose)
