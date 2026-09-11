\# Recibos — Plataforma de gestión y seguimiento de recibos de luz



Sistema para administrar propiedades, generar recibos de consumo eléctrico y gestionar tickets de mantenimiento.



\## Stack



| Capa | Tecnología |

|------|-----------|

| \*\*Frontend\*\* | React 19 + Vite 8 + Tailwind CSS 4 |

| \*\*Backend\*\* | Node.js 22 + Express 5 + Prisma 5 |

| \*\*Base de datos\*\* | MySQL 8 (Docker) |

| \*\*Package manager\*\* | pnpm 11 (frontend y backend) |

| \*\*Orquestación\*\* | Docker Compose |



\## Requisitos



\- Docker Desktop (con Docker Compose v2)

\- Node.js 22.13+ (requerido por pnpm 11)

\- pnpm 11 — instalar con `corepack enable \&\& corepack prepare pnpm@latest --activate`

\- Git



\## Usuarios de prueba (seed)



| Rol | Email | Password |

|-----|-------|----------|

| Admin | admin@bap.com | admin123 |

| Tenant | local1@mail.com | Temp123! |



\## Arrancar local



Terminal 1 - Backend + BD:

```

cd backend

docker compose up -d

docker compose ps

```



Terminal 2 - Frontend:

```

cd frontend

pnpm install

pnpm dev

```



Acceder a: http://localhost:5173



\## Parar local



\- Terminal frontend: Ctrl + C

\- Terminal backend:

```

cd backend

docker compose down

```



\## Reset completo de la BD



```

cd backend

docker compose down -v

docker compose up -d

Start-Sleep -Seconds 20

docker compose cp ./prisma/seed.js backend:/app/prisma/seed.js

docker compose exec backend pnpm exec prisma db seed

```



\## Comandos de Prisma



Ejecutar SIEMPRE dentro del contenedor.



```

docker compose exec backend pnpm exec prisma migrate status

docker compose exec backend pnpm exec prisma migrate deploy

docker compose exec backend pnpm exec prisma migrate dev --name descripcion\_corta

docker compose exec backend pnpm exec prisma db seed

```



\## Verificar drift de migraciones



```

docker compose exec backend pnpm exec prisma migrate diff --from-url "mysql://root:root@db:3306/bap\_db" --to-schema-datamodel prisma/schema.prisma --script

```



Si devuelve "This is an empty migration" -> todo sincronizado.

Si devuelve ALTER TABLE / DROP -> hay drift, crear nueva migracion.



\## Desplegar a produccion



El push a main dispara el deploy automatico en Railway y Vercel.



```

cd Recibos

git add .

git commit -m "descripcion del cambio"

git push origin main

```



\## Notas tecnicas



\- pnpm 11 requiere Node 22.13+ (por node:sqlite). No funciona en Node 20.

\- Las imagenes node:\*-slim no traen OpenSSL. Prisma lo necesita, se instala en el Dockerfile.

\- El backend corre prisma migrate deploy automaticamente al arrancar.

