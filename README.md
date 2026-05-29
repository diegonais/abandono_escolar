# abandono_escolar

Sistema web para la identificacion temprana del riesgo de abandono escolar en estudiantes de secundaria de unidades educativas fiscales.

## Stack
- Backend: NestJS + TypeScript + Prisma + PostgreSQL
- Frontend: React + Vite + TypeScript
- Base de datos: PostgreSQL (Docker)
- Gestor visual recomendado: TablePlus

## Estructura

```text
abandono_escolar/
  docker-compose.yml
  README.md
  backend/
  frontend/
```

## Levantar PostgreSQL con Docker
Desde la raiz del proyecto:

```bash
docker compose up -d
```

Verificar estado:

```bash
docker compose ps
```

Ver logs:

```bash
docker compose logs -f postgres
```

Detener servicio:

```bash
docker compose down
```

## Configurar backend

```bash
cd backend
npm install
```

Si no existe `.env`, crearlo desde `.env.example`:

```bash
cp .env.example .env
```

Variables esperadas (`backend/.env`):

```env
DATABASE_URL="postgresql://abandono_user:abandono_pass@localhost:5434/abandono_escolar_db?schema=public"
PORT=3000
```

## Correr migraciones (Prisma)

```bash
cd backend
npm run prisma:migrate
```

La primera migracion del proyecto crea el esquema inicial (`init_schema`) con tablas como:
`roles`, `users`, `school_years`, `courses`, `subjects`, `students`, `enrollments`,
`attendances`, `grades`, `student_follow_ups`, `risk_criteria`, `risk_evaluations` y `alerts`.

## Generar Prisma Client

```bash
cd backend
npm run prisma:generate
```

## Levantar el backend

```bash
cd backend
npm run start:dev
```

API local: `http://localhost:3000`

Endpoint de salud:

```http
GET /health
```

Respuesta:

```json
{
  "status": "ok",
  "service": "abandono-escolar-api"
}
```

## Abrir la base de datos en TablePlus
Crear una nueva conexion PostgreSQL con:

- Host: `localhost`
- Port: `5434`
- User: `abandono_user`
- Password: `abandono_pass`
- Database: `abandono_escolar_db`
- SSL: `Disable`

Pasos:
1. Verificar que PostgreSQL este activo (`docker compose ps`).
2. En TablePlus, crear una nueva conexion PostgreSQL.
3. Completar los datos y presionar `Test`.
4. Guardar y abrir la base.
5. Revisar las tablas del esquema inicial generadas por Prisma (seccion `public`).

## Scripts utiles backend
En `backend/package.json`:

- `npm run start:dev`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:studio`
- `npm run prisma:format`
