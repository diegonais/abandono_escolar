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
JWT_SECRET="cambia_este_secreto_jwt_en_desarrollo"
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
Swagger: `http://localhost:3000/docs`

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

## Autenticacion JWT (backend)

### Endpoints
- `POST /auth/login`
- `GET /auth/me` (protegido con Bearer Token)

### Probar login en Postman
1. Levantar backend con `npm run start:dev` desde `backend/`.
2. Crear request `POST http://localhost:3000/auth/login`.
3. En `Body` usar `raw` + `JSON`:

```json
{
  "email": "admin@abandono.test",
  "password": "Admin123456"
}
```

4. En la respuesta copiar `accessToken`.
5. Crear request `GET http://localhost:3000/auth/me`.
6. En `Authorization` elegir `Bearer Token` y pegar el `accessToken`.
7. Verificar que retorna datos basicos del usuario: `id`, `fullName`, `email`, `role`.

## Modulo Users (backend)

### Requisitos previos para probar
1. Ejecutar seed para tener roles y usuario ADMIN:

```bash
cd backend
yarn prisma:seed
```

2. Hacer login con `POST /auth/login` y copiar `accessToken`.
3. Usar `Authorization: Bearer <token>` en todos los endpoints de `/users`.

### Endpoints disponibles
- `GET /users?page=1&limit=10`
- `GET /users?page=1&limit=10&roleId=<uuid_rol>`
- `GET /users?page=1&limit=10&roleName=ADMIN`
- `GET /users/:id`
- `POST /users`
- `PATCH /users/:id`
- `PATCH /users/:id/deactivate`
- `PATCH /users/:id/activate`

Para obtener `roleId` antes de crear usuario, usar:

```sql
SELECT id, name FROM roles ORDER BY name;
```

### Ejemplo crear usuario (ADMIN)
`POST /users`

```json
{
  "email": "docente1@abandono.test",
  "fullName": "Docente Uno",
  "password": "Docente123",
  "roleId": "UUID_DEL_ROL_DOCENTE"
}
```

### Ejemplo actualizar usuario (ADMIN)
`PATCH /users/:id`

```json
{
  "fullName": "Docente Uno Actualizado",
  "email": "docente1.actualizado@abandono.test"
}
```

### Ejemplo desactivar y activar (ADMIN)
- `PATCH /users/:id/deactivate`
- `PATCH /users/:id/activate`

El modulo no realiza eliminacion fisica. La desactivacion actualiza `isActive=false`.

## Ejecutar seed inicial (Prisma)

Desde `backend/`:

```bash
yarn prisma:seed
```

Si usas npm:

```bash
npm run prisma:seed
```

El seed crea y actualiza (idempotente) los siguientes datos de prueba:

- Roles: `ADMIN`, `DIRECTOR`, `DOCENTE`, `SEGUIMIENTO`.
- Usuario administrador:
  - Email: `admin@abandono.test`
  - Password: `Admin123456`
  - Full name: `Administrador del Sistema`
  - Rol: `ADMIN`
- Gestion escolar actual: `Gestion {anio_actual}`.
- Cursos: `1ro A Secundaria`, `2do A Secundaria`, `3ro A Secundaria`.
- Materias: `Matematica`, `Lenguaje`, `Ciencias Sociales`, `Ciencias Naturales`.
- 10 estudiantes ficticios con inscripciones.
- Asistencias de ejemplo.
- Calificaciones de ejemplo.
- Seguimientos de ejemplo.
- Criterios basicos de riesgo:
  - `faltas >= 3`
  - `promedio < 51`
  - `seguimientos >= 2`

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
6. Ejecutar consultas rapidas para verificar registros:

```sql
SELECT COUNT(*) FROM roles;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM school_years;
SELECT COUNT(*) FROM courses;
SELECT COUNT(*) FROM subjects;
SELECT COUNT(*) FROM students;
SELECT COUNT(*) FROM enrollments;
SELECT COUNT(*) FROM attendances;
SELECT COUNT(*) FROM grades;
SELECT COUNT(*) FROM student_follow_ups;
SELECT COUNT(*) FROM risk_criteria;
```

Para revisar usuarios con sus roles:

```sql
SELECT
  u.id,
  u.email,
  u."fullName",
  u."isActive",
  r.name AS role
FROM users u
INNER JOIN roles r ON r.id = u."roleId"
ORDER BY u.email;
```

Para verificar usuarios activos/inactivos creados desde el modulo `Users`:

```sql
SELECT
  u.id,
  u.email,
  u."fullName",
  u."isActive",
  r.name AS role_name,
  u."createdAt",
  u."updatedAt"
FROM users u
INNER JOIN roles r ON r.id = u."roleId"
ORDER BY u."createdAt" DESC;
```

## Scripts utiles backend
En `backend/package.json`:

- `npm run start:dev`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run prisma:studio`
- `npm run prisma:format`
