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

## Modulo Grades (backend)

### Roles por accion
- `DOCENTE`: registra calificaciones (`POST /grades`, `POST /grades/bulk`).
- `ADMIN`: registra y corrige calificaciones (`POST`, `POST /bulk`, `PATCH`).
- `DIRECTOR`: consulta calificaciones y resumen academico.
- `SEGUIMIENTO`: consulta calificaciones y resumen academico.

### Endpoints disponibles
- `POST /grades`
- `POST /grades/bulk`
- `GET /grades`
- `GET /grades/by-student/:studentId`
- `GET /grades/by-course/:courseId`
- `PATCH /grades/:id`
- `GET /grades/summary/student/:studentId`

### Periodos academicos validos
- `BIMESTRE_1`
- `BIMESTRE_2`
- `BIMESTRE_3`
- `BIMESTRE_4`
- `FINAL`

### Reglas de negocio
- Nota minima: `0`.
- Nota maxima: `100`.
- No se permite duplicar para la combinacion `studentId + subjectId + courseId + period`.
- En carga masiva (`bulk`) tambien se valida que no haya duplicados dentro del lote.

### Filtros disponibles en listados
Se aplican en `GET /grades`, `GET /grades/by-student/:studentId` y
`GET /grades/by-course/:courseId`:
- `studentId`
- `subjectId`
- `courseId`
- `period`

Ejemplo:
`GET /grades?courseId=<uuid>&period=BIMESTRE_1`

### Ejemplo registrar calificacion individual
`POST /grades`

```json
{
  "studentId": "UUID_ESTUDIANTE",
  "subjectId": "UUID_MATERIA",
  "courseId": "UUID_CURSO",
  "period": "BIMESTRE_1",
  "score": 78.5
}
```

## Modulo StudentFollowUps (backend)

### Roles por accion
- `ADMIN`, `DIRECTOR`, `SEGUIMIENTO`: pueden crear seguimientos de cualquier tipo.
- `DOCENTE`: puede crear seguimientos solo de tipo `ACADEMICO` o `CONDUCTUAL`.
- `ADMIN`, `DIRECTOR`, `DOCENTE`, `SEGUIMIENTO`: pueden consultar, actualizar y eliminar seguimientos.

### Endpoints disponibles
- `POST /student-follow-ups`
- `GET /student-follow-ups`
- `GET /student-follow-ups/by-student/:studentId`
- `PATCH /student-follow-ups/:id`
- `DELETE /student-follow-ups/:id`
- `GET /student-follow-ups/summary/student/:studentId`

### Tipos validos de seguimiento
- `ACADEMICO`
- `CONDUCTUAL`
- `FAMILIAR`
- `ECONOMICO`
- `SOCIAL`
- `OTRO`

### Reglas de negocio
- `responsibleUserId` se toma del usuario autenticado (JWT), no del body.
- `studentId` debe existir.
- Para `DOCENTE`, se rechazan tipos diferentes a `ACADEMICO` y `CONDUCTUAL`.

### Como registrar seguimiento
1. Hacer login con `POST /auth/login` y copiar `accessToken`.
2. Usar `Authorization: Bearer <token>`.
3. Ejecutar `POST /student-follow-ups`:

```json
{
  "studentId": "UUID_ESTUDIANTE",
  "type": "ACADEMICO",
  "description": "Bajo rendimiento sostenido en matematica.",
  "actionTaken": "Se acordo plan de refuerzo con tutor.",
  "followUpDate": "2026-05-30",
  "nextReviewDate": "2026-06-07"
}
```

Nota: `responsibleUserId` no se envia; el backend lo asigna automaticamente desde el token.

### Resumen por estudiante
Endpoint: `GET /student-follow-ups/summary/student/:studentId`

Respuesta esperada:

```json
{
  "studentId": "UUID_ESTUDIANTE",
  "totalSeguimientos": 4,
  "totalPorTipo": {
    "ACADEMICO": 2,
    "CONDUCTUAL": 1,
    "FAMILIAR": 0,
    "ECONOMICO": 0,
    "SOCIAL": 1,
    "OTRO": 0
  },
  "ultimosSeguimientos": [
    {
      "id": "UUID_SEGUIMIENTO",
      "studentId": "UUID_ESTUDIANTE",
      "responsibleUserId": "UUID_USUARIO",
      "type": "ACADEMICO",
      "description": "Bajo rendimiento sostenido en matematica.",
      "actionTaken": "Se acordo plan de refuerzo con tutor.",
      "followUpDate": "2026-05-30T00:00:00.000Z",
      "nextReviewDate": "2026-06-07T00:00:00.000Z",
      "student": {
        "id": "UUID_ESTUDIANTE",
        "firstName": "Juan",
        "lastName": "Perez",
        "ci": "9000001"
      },
      "responsibleUser": {
        "id": "UUID_USUARIO",
        "fullName": "Administrador del Sistema",
        "email": "admin@abandono.test",
        "role": "ADMIN"
      },
      "createdAt": "2026-05-30T00:00:00.000Z",
      "updatedAt": "2026-05-30T00:00:00.000Z"
    }
  ]
}
```

## Modulo RiskEngine (backend)

### Roles por accion
- `ADMIN`, `DIRECTOR`, `DOCENTE`, `SEGUIMIENTO`: evaluar riesgo por estudiante.
- `ADMIN`, `DIRECTOR`, `SEGUIMIENTO`: ejecutar evaluacion masiva.

### Endpoints disponibles
- `GET /risk/student/:studentId/evaluate`
- `POST /risk/evaluate-all`

### Reglas de evaluacion
- `attendanceIrregular = true` cuando `faltas + atrasos >= 3` en los ultimos 30 dias.
- `lowAcademicPerformance = true` cuando `promedioGeneral < 51` o `materiasReprobadas >= 2`.
- `relevantFollowUps = true` cuando `seguimientos >= 2` en los ultimos 60 dias.
- `SIN_RIESGO`: 0 indicadores activos.
- `BAJO`: 1 indicador activo.
- `MEDIO`: 2 indicadores activos.
- `ALTO`: 3 indicadores activos.

### Ejemplo evaluar un estudiante
`GET /risk/student/:studentId/evaluate`

```json
{
  "studentId": "UUID_ESTUDIANTE",
  "riskLevel": "MEDIO",
  "indicators": {
    "attendanceIrregular": true,
    "lowAcademicPerformance": true,
    "relevantFollowUps": false
  },
  "details": {
    "absencesCount": 2,
    "delaysCount": 1,
    "averageGrade": 49.75,
    "failedSubjectsCount": 2,
    "followUpsCount": 1
  }
}
```

Notas:
- Cada evaluacion se guarda en la tabla `risk_evaluations`.
- El detalle adicional queda en la columna JSON `indicators` (incluye banderas y contadores usados por el motor).
- Puedes ejecutar y probar estos endpoints desde Swagger en `http://localhost:3000/docs` (tag `risk`).

## Modulo Alerts (backend)

### Roles por accion
- `ADMIN`: puede listar, consultar detalle, generar alertas y actualizar estado.
- `DIRECTOR`, `SEGUIMIENTO`: pueden listar, consultar detalle y actualizar estado.
- `DOCENTE`: puede listar y consultar alertas (prototipo).

### Endpoints disponibles
- `GET /alerts`
- `GET /alerts/:id`
- `GET /alerts/by-student/:studentId`
- `PATCH /alerts/:id/status`
- `POST /alerts/generate/student/:studentId`
- `POST /alerts/generate/all`

### Estados validos de alerta
- `PENDIENTE`
- `EN_REVISION`
- `ATENDIDA`
- `DESCARTADA`

### Reglas de negocio
- La generacion usa el `RiskEngineService`.
- Si la evaluacion retorna `SIN_RIESGO`, no se crea alerta.
- Se evita duplicar alertas `PENDIENTE` para el mismo estudiante y mismo nivel de riesgo.
- Cada alerta guarda: `title`, `description`, `riskLevel`, `status`, `studentId`, `schoolYearId`, `riskEvaluationId` (opcional).

### Flujo recomendado de uso
`registrar asistencia/calificaciones/seguimiento -> evaluar riesgo -> generar alerta -> revisar alerta en TablePlus`

### Ejemplo generar alerta por estudiante
`POST /alerts/generate/student/:studentId`

Respuesta posible:

```json
{
  "generated": true,
  "studentId": "UUID_ESTUDIANTE",
  "message": "Alerta generada correctamente.",
  "alert": {
    "id": "UUID_ALERTA",
    "title": "Alerta preventiva de riesgo MEDIO",
    "description": "Se detecto riesgo MEDIO para el estudiante por: asistencia irregular, bajo rendimiento academico.",
    "riskLevel": "MEDIO",
    "status": "PENDIENTE",
    "studentId": "UUID_ESTUDIANTE",
    "schoolYearId": "UUID_GESTION",
    "riskEvaluationId": "UUID_EVALUACION"
  }
}
```

### Ejemplo registrar calificaciones por lote
`POST /grades/bulk`

```json
[
  {
    "studentId": "UUID_ESTUDIANTE_1",
    "subjectId": "UUID_MATERIA_MAT",
    "courseId": "UUID_CURSO",
    "period": "BIMESTRE_1",
    "score": 84
  },
  {
    "studentId": "UUID_ESTUDIANTE_2",
    "subjectId": "UUID_MATERIA_MAT",
    "courseId": "UUID_CURSO",
    "period": "BIMESTRE_1",
    "score": 49.75
  }
]
```

### Ejemplo corregir calificacion
`PATCH /grades/:id`

```json
{
  "score": 55
}
```

### Resumen por estudiante
Endpoint: `GET /grades/summary/student/:studentId`

Respuesta esperada:

```json
{
  "studentId": "UUID_ESTUDIANTE",
  "promedioGeneral": 58.5,
  "materiasReprobadas": 1,
  "notasPorMateria": [
    {
      "subjectId": "UUID_MATERIA_MAT",
      "subjectName": "Matematica",
      "promedioMateria": 47.5,
      "estaReprobada": true,
      "periodos": [
        {
          "period": "BIMESTRE_1",
          "score": 47.5
        }
      ]
    }
  ],
  "indicadorBajoRendimiento": true
}
```

## Modulo Reports (backend)

### Roles por acceso
- `ADMIN`, `DIRECTOR`, `SEGUIMIENTO`: acceso completo al modulo.
- `DOCENTE`: acceso habilitado a reportes generales para simplificar el prototipo.

### Endpoints disponibles
- `GET /reports/students-at-risk`
- `GET /reports/course/:courseId/risk-summary`
- `GET /reports/student/:studentId/full`
- `GET /reports/dashboard`

### Descripcion de reportes
- `GET /reports/students-at-risk`: lista estudiantes activos con datos basicos, ultimo nivel de riesgo, indicadores activos y estado de alerta.
- `GET /reports/course/:courseId/risk-summary`: resumen de un curso con `totalEstudiantes`, `totalRiesgoBajo`, `totalRiesgoMedio`, `totalRiesgoAlto`, `totalSinRiesgo`.
- `GET /reports/student/:studentId/full`: reporte completo por estudiante con curso actual, resumen de asistencia, resumen de calificaciones, seguimientos recientes, ultima evaluacion de riesgo y alertas activas.
- `GET /reports/dashboard`: KPIs generales (`totalEstudiantes`, `estudiantesConRiesgo`, `alertasPendientes`, `promedioGeneral`, `estudiantesConAsistenciaIrregular`, `estudiantesConBajoRendimiento`, `distribucionRiesgo`).

### Swagger
- Documentacion disponible en `http://localhost:3000/docs` (tag `reports`).
- Todos los endpoints de reportes requieren `Authorization: Bearer <token>`.

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
- Calificaciones de ejemplo (periodo `BIMESTRE_1`).
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
SELECT COUNT(*) FROM risk_evaluations;
SELECT COUNT(*) FROM alerts;
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

Para verificar calificaciones desde TablePlus:

```sql
SELECT
  g.id,
  g.period,
  g.score,
  g."createdAt",
  s."firstName" || ' ' || s."lastName" AS student_name,
  sub.name AS subject_name,
  c.level || ' ' || c.parallel AS course_name
FROM grades g
INNER JOIN students s ON s.id = g."studentId"
INNER JOIN subjects sub ON sub.id = g."subjectId"
INNER JOIN courses c ON c.id = g."courseId"
ORDER BY g."createdAt" DESC;
```

Para verificar seguimientos estudiantiles desde TablePlus:

```sql
SELECT
  sfu.id,
  sfu.type,
  sfu.description,
  sfu."actionTaken",
  sfu."followUpDate",
  sfu."nextReviewDate",
  sfu."createdAt",
  s."firstName" || ' ' || s."lastName" AS student_name,
  u."fullName" AS responsible_user_name,
  r.name AS responsible_role
FROM student_follow_ups sfu
INNER JOIN students s ON s.id = sfu."studentId"
INNER JOIN users u ON u.id = sfu."responsibleUserId"
INNER JOIN roles r ON r.id = u."roleId"
ORDER BY sfu."followUpDate" DESC, sfu."createdAt" DESC;
```

Para verificar evaluaciones de riesgo desde TablePlus:

```sql
SELECT
  re.id,
  re."studentId",
  re."schoolYearId",
  re."riskLevel",
  re."riskScore",
  re."averageGrade",
  re."totalAbsences",
  re."evaluatedAt",
  re.indicators,
  s."firstName" || ' ' || s."lastName" AS student_name,
  sy.name AS school_year_name
FROM risk_evaluations re
INNER JOIN students s ON s.id = re."studentId"
INNER JOIN school_years sy ON sy.id = re."schoolYearId"
ORDER BY re."evaluatedAt" DESC;
```

Para verificar alertas desde TablePlus:

```sql
SELECT
  a.id,
  a.title,
  a.description,
  a."riskLevel",
  a.status,
  a."studentId",
  a."schoolYearId",
  a."riskEvaluationId",
  a."createdAt",
  s."firstName" || ' ' || s."lastName" AS student_name,
  sy.name AS school_year_name
FROM alerts a
INNER JOIN students s ON s.id = a."studentId"
INNER JOIN school_years sy ON sy.id = a."schoolYearId"
ORDER BY a."createdAt" DESC;
```

Para verificar informacion base usada por reportes desde TablePlus:

```sql
-- Ultima evaluacion de riesgo por estudiante
SELECT DISTINCT ON (re."studentId")
  re."studentId",
  s."firstName" || ' ' || s."lastName" AS student_name,
  re."riskLevel",
  re."riskScore",
  re."attendanceRate",
  re."averageGrade",
  re."totalAbsences",
  re."evaluatedAt",
  re.indicators
FROM risk_evaluations re
INNER JOIN students s ON s.id = re."studentId"
ORDER BY re."studentId", re."evaluatedAt" DESC;

-- Alertas activas para seguimiento (PENDIENTE o EN_REVISION)
SELECT
  a.id,
  a."studentId",
  s."firstName" || ' ' || s."lastName" AS student_name,
  a.status,
  a."riskLevel",
  a."createdAt"
FROM alerts a
INNER JOIN students s ON s.id = a."studentId"
WHERE a.status IN ('PENDIENTE', 'EN_REVISION')
ORDER BY a."createdAt" DESC;

-- Resumen de riesgo por curso (base para /reports/course/:courseId/risk-summary)
SELECT
  c.id AS course_id,
  c.level,
  c.parallel,
  COUNT(DISTINCT e."studentId") AS total_estudiantes_activos
FROM courses c
INNER JOIN enrollments e ON e."courseId" = c.id
INNER JOIN students s ON s.id = e."studentId"
WHERE e.status = 'ACTIVE'
  AND s."isActive" = true
GROUP BY c.id, c.level, c.parallel
ORDER BY c.level, c.parallel;
```

Para revisar resumen academico por estudiante desde SQL:

```sql
WITH notas_por_materia AS (
  SELECT
    g."studentId",
    g."subjectId",
    sub.name AS subject_name,
    ROUND(AVG(g.score)::numeric, 2) AS promedio_materia
  FROM grades g
  INNER JOIN subjects sub ON sub.id = g."subjectId"
  WHERE g."studentId" = 'UUID_ESTUDIANTE'
  GROUP BY g."studentId", g."subjectId", sub.name
)
SELECT
  npm."studentId",
  ROUND(AVG(npm.promedio_materia)::numeric, 2) AS promedio_general,
  COUNT(*) FILTER (WHERE npm.promedio_materia < 51) AS materias_reprobadas
FROM notas_por_materia npm
GROUP BY npm."studentId";
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
