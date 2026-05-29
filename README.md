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

## Modulos Academicos Base (backend)

### Roles por accion
- `ADMIN`: crear, editar y desactivar (y eliminar en `Courses`).
- `DIRECTOR`: listar y consultar detalle.
- `DOCENTE`: listar.
- `SEGUIMIENTO`: listar.

### SchoolYears (`/school-years`)
- `GET /school-years?page=1&limit=10`
- `GET /school-years?page=1&limit=10&isActive=true`
- `GET /school-years/:id`
- `POST /school-years`
- `PATCH /school-years/:id`
- `PATCH /school-years/:id/deactivate`

Payload ejemplo `POST /school-years`:

```json
{
  "name": "Gestion 2027",
  "startDate": "2027-01-15",
  "endDate": "2027-12-15",
  "isActive": true
}
```

### Courses (`/courses`)
- `GET /courses?page=1&limit=10`
- `GET /courses?page=1&limit=10&schoolYearId=<uuid>`
- `GET /courses/:id`
- `POST /courses`
- `PATCH /courses/:id`
- `DELETE /courses/:id`

Regla: no se permite duplicar `level + parallel + schoolYearId`.

Payload ejemplo `POST /courses`:

```json
{
  "level": "4to Secundaria",
  "parallel": "A",
  "schoolYearId": "UUID_DE_GESTION"
}
```

### Subjects (`/subjects`)
- `GET /subjects?page=1&limit=10`
- `GET /subjects?page=1&limit=10&isActive=true`
- `GET /subjects/:id`
- `POST /subjects`
- `PATCH /subjects/:id`
- `PATCH /subjects/:id/deactivate`

Reglas:
- no se permiten nombres duplicados de materia.
- `code` es opcional.

Payload ejemplo `POST /subjects`:

```json
{
  "name": "Fisica",
  "code": "FIS",
  "isActive": true
}
```

## Modulos Students y Enrollments (backend)

### Roles por accion
- `ADMIN`: crea, actualiza, activa/desactiva estudiantes y gestiona inscripciones/estado.
- `DIRECTOR`: consulta estudiantes e inscripciones.
- `DOCENTE`: consulta estudiantes e inscripciones (incluyendo por curso).
- `SEGUIMIENTO`: consulta estudiantes e inscripciones.

### Students (`/students`)
- `GET /students?page=1&limit=10`
- `GET /students?page=1&limit=10&search=<texto>`
- `GET /students?page=1&limit=10&search=<texto>&isActive=true`
- `GET /students/:id`
- `POST /students`
- `PATCH /students/:id`
- `PATCH /students/:id/deactivate`
- `PATCH /students/:id/activate`

Reglas:
- No hay eliminacion fisica de estudiantes.
- La baja logica se realiza con `isActive=false`.
- Busqueda por `firstName`, `lastName` o `ci` (case-insensitive).

Payload ejemplo `POST /students`:

```json
{
  "firstName": "Maria",
  "lastName": "Quispe",
  "ci": "12345678",
  "birthDate": "2010-05-21",
  "gender": "F",
  "tutorName": "Juana Mamani",
  "tutorPhone": "+59170000000",
  "address": "Zona central, calle 10",
  "isActive": true
}
```

### Enrollments (`/enrollments`)
- `POST /enrollments`
- `GET /enrollments?page=1&limit=10`
- `GET /enrollments?page=1&limit=10&schoolYearId=<uuid>&status=ACTIVE`
- `GET /enrollments/by-course/:courseId?page=1&limit=10`
- `GET /enrollments/by-student/:studentId?page=1&limit=10`
- `PATCH /enrollments/:id/status`

Reglas:
- No se permite inscripcion duplicada para la combinacion `studentId + courseId + schoolYearId`.
- El estado de la inscripcion se controla con `status` (`ACTIVE` o `INACTIVE`).

Payload ejemplo `POST /enrollments`:

```json
{
  "studentId": "UUID_ESTUDIANTE",
  "courseId": "UUID_CURSO",
  "schoolYearId": "UUID_GESTION",
  "status": "ACTIVE"
}
```

Payload ejemplo `PATCH /enrollments/:id/status`:

```json
{
  "status": "INACTIVE"
}
```

### Flujo sugerido: crear estudiante e inscribir
1. Login con `POST /auth/login` y usar Bearer Token de un usuario `ADMIN`.
2. Crear estudiante con `POST /students`.
3. Obtener `courseId` y `schoolYearId` desde `GET /courses` o desde TablePlus.
4. Crear inscripcion con `POST /enrollments` usando el `id` del estudiante creado.
5. Verificar el resultado con `GET /students?search=<ci_o_nombre>` y `GET /enrollments/by-student/:studentId`.

## Modulo Attendance (backend)

### Roles por accion
- `DOCENTE`: registra asistencias (`POST /attendance`, `POST /attendance/bulk`).
- `ADMIN`: registra y corrige asistencias (`POST`, `POST /bulk`, `PATCH`).
- `DIRECTOR`: consulta asistencias.
- `SEGUIMIENTO`: consulta asistencias.

### Endpoints disponibles
- `POST /attendance`
- `POST /attendance/bulk`
- `GET /attendance`
- `GET /attendance/by-student/:studentId`
- `GET /attendance/by-course/:courseId`
- `PATCH /attendance/:id`
- `GET /attendance/summary/student/:studentId`

### Estados validos de asistencia
- `PRESENTE`
- `FALTA`
- `ATRASO`
- `JUSTIFICADO`

### Reglas de negocio
- No se permiten fechas futuras.
- No se permiten duplicados para la combinacion `studentId + courseId + date`.
- En carga masiva (`bulk`) tambien se valida que no haya duplicados dentro del lote.

### Filtros disponibles en listados
Se aplican en `GET /attendance`, `GET /attendance/by-student/:studentId` y
`GET /attendance/by-course/:courseId`:
- `dateFrom`
- `dateTo`
- `courseId`
- `studentId`
- `status`

Ejemplo:
`GET /attendance?dateFrom=2026-05-01&dateTo=2026-05-31&courseId=<uuid>&status=FALTA`

### Ejemplo registrar asistencia individual
`POST /attendance`

```json
{
  "studentId": "UUID_ESTUDIANTE",
  "courseId": "UUID_CURSO",
  "date": "2026-05-20",
  "status": "PRESENTE",
  "observation": "Ingreso puntual."
}
```

### Ejemplo registrar asistencia por lote
`POST /attendance/bulk`

```json
[
  {
    "studentId": "UUID_ESTUDIANTE_1",
    "courseId": "UUID_CURSO",
    "date": "2026-05-20",
    "status": "PRESENTE"
  },
  {
    "studentId": "UUID_ESTUDIANTE_2",
    "courseId": "UUID_CURSO",
    "date": "2026-05-20",
    "status": "ATRASO",
    "observation": "Ingreso 10 minutos tarde."
  }
]
```

### Ejemplo corregir asistencia
`PATCH /attendance/:id`

```json
{
  "status": "JUSTIFICADO",
  "observation": "Falta justificada con certificado."
}
```

### Resumen por estudiante
Endpoint: `GET /attendance/summary/student/:studentId`

Filtros opcionales:
- `dateFrom`
- `dateTo`

Respuesta esperada:

```json
{
  "studentId": "UUID_ESTUDIANTE",
  "totalPresentes": 15,
  "totalFaltas": 2,
  "totalAtrasos": 1,
  "totalJustificados": 1,
  "rangoUsado": {
    "dateFrom": "2026-05-01",
    "dateTo": "2026-05-31"
  }
}
```

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

Para verificar datos de modulos academicos desde TablePlus:

```sql
SELECT id, name, "startDate", "endDate", "isActive"
FROM school_years
ORDER BY "startDate" DESC;

SELECT
  c.id,
  c.level,
  c.parallel,
  c."schoolYearId",
  sy.name AS school_year_name,
  c."createdAt"
FROM courses c
INNER JOIN school_years sy ON sy.id = c."schoolYearId"
ORDER BY sy."startDate" DESC, c.level ASC, c.parallel ASC;

SELECT id, name, code, "isActive", "createdAt", "updatedAt"
FROM subjects
ORDER BY name ASC;
```

Para verificar estudiantes e inscripciones desde TablePlus:

```sql
SELECT
  s.id,
  s."firstName",
  s."lastName",
  s.ci,
  s."isActive",
  s."createdAt",
  s."updatedAt"
FROM students s
ORDER BY s."createdAt" DESC;

SELECT
  e.id,
  e."studentId",
  e."courseId",
  e."schoolYearId",
  e.status,
  e."createdAt",
  s."firstName" || ' ' || s."lastName" AS student_name,
  c.level || ' ' || c.parallel AS course_name,
  sy.name AS school_year_name
FROM enrollments e
INNER JOIN students s ON s.id = e."studentId"
INNER JOIN courses c ON c.id = e."courseId"
INNER JOIN school_years sy ON sy.id = e."schoolYearId"
ORDER BY e."createdAt" DESC;
```

Para verificar asistencias desde TablePlus:

```sql
SELECT
  a.id,
  a.date,
  a.status,
  a.observation,
  a."createdAt",
  s."firstName" || ' ' || s."lastName" AS student_name,
  c.level || ' ' || c.parallel AS course_name
FROM attendances a
INNER JOIN students s ON s.id = a."studentId"
INNER JOIN courses c ON c.id = a."courseId"
ORDER BY a.date DESC, a."createdAt" DESC;
```

Para revisar resumen rapido por estudiante desde SQL:

```sql
SELECT
  a."studentId",
  COUNT(*) FILTER (WHERE a.status = 'PRESENTE') AS total_presentes,
  COUNT(*) FILTER (WHERE a.status = 'FALTA') AS total_faltas,
  COUNT(*) FILTER (WHERE a.status = 'ATRASO') AS total_atrasos,
  COUNT(*) FILTER (WHERE a.status = 'JUSTIFICADO') AS total_justificados
FROM attendances a
WHERE a."studentId" = 'UUID_ESTUDIANTE'
GROUP BY a."studentId";
```

## Scripts utiles backend
En `backend/package.json`:

- `npm run start:dev`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- `npm run prisma:seed`
- `npm run prisma:studio`
- `npm run prisma:format`
