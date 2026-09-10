FROM node:22-bookworm-slim

WORKDIR /app

# Instalar OpenSSL (Prisma lo necesita para cargar sus engines)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Activar Corepack (viene con Node 20) para usar pnpm
RUN corepack enable

# Copiar archivos necesarios para instalar dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Instalar con pnpm (frozen = falla si el lockfile no coincide)
RUN pnpm install --frozen-lockfile

# Copiar el resto del código
COPY . .

# Generar el cliente de Prisma
RUN pnpm exec prisma generate

EXPOSE 4000

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node src/seedUser.js && node src/index.js"]