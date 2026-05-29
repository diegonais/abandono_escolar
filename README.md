# abandono_escolar

Sistema web para la identificacion temprana del riesgo de abandono escolar en estudiantes de secundaria de unidades educativas fiscales.

## Stack
- Backend: NestJS + TypeScript + Prisma + PostgreSQL
- Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui + Recharts
- Base de datos: PostgreSQL (Docker)
- Gestor visual recomendado: TablePlus

## Estructura

```text
abandono_escolar/
  docker-compose.yml
  .gitignore
  README.md
  AGENTS.md
  backend/
  frontend/
```

## Requisitos previos
- Node.js 20+
- npm 10+
- Docker Desktop
- TablePlus (opcional, para gestion visual de BD)

## 1) Instalar dependencias
Desde la raiz del proyecto:

```bash
cd backend
npm install

cd ../frontend
npm install
```

## 2) Levantar PostgreSQL (Docker)
Desde la raiz:

```bash
docker compose up -d
```

Ver logs (opcional):

```bash
docker compose logs -f postgres
```

Detener servicio:

```bash
docker compose down
```

## 3) Configurar variables de entorno

Backend:

```bash
cd backend
cp .env.example .env
```

Frontend:

```bash
cd frontend
cp .env.example .env
```

## 4) Preparar Prisma

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
```

## 5) Levantar backend

```bash
cd backend
npm run start:dev
```

API local esperada: `http://localhost:3000`

## 6) Levantar frontend

```bash
cd frontend
npm run dev
```

App web local esperada: `http://localhost:5173`

## Conexión con TablePlus
Crear una nueva conexion PostgreSQL con estos datos:

- Host: `localhost`
- Port: `5434`
- User: `abandono_user`
- Password: `abandono_pass`
- Database: `abandono_escolar_db`
- SSL: `Disable`

Prueba de conexion:
1. Asegura que el contenedor este activo (`docker compose ps`).
2. En TablePlus, presiona `Test`.
3. Guarda la conexion y abre la base de datos.

## Scripts principales

Backend (`backend/package.json`):
- `npm run start:dev` inicia Nest en modo desarrollo.
- `npm run build` compila TypeScript.
- `npm run prisma:studio` abre Prisma Studio.

Frontend (`frontend/package.json`):
- `npm run dev` inicia Vite.
- `npm run build` compila frontend.
- `npm run preview` previsualiza build.
