# AGENTS.md

## Contexto del proyecto
Este proyecto se llama abandono_escolar. Es un sistema web para apoyar la identificación temprana del riesgo de abandono escolar en estudiantes de secundaria de unidades educativas fiscales. El sistema registra asistencia, rendimiento académico y seguimiento estudiantil para generar alertas preventivas.

## Estructura
- backend: API NestJS con Prisma y PostgreSQL.
- frontend: React + Vite + TypeScript.
- docker-compose.yml: levanta PostgreSQL.
- TablePlus se usa como gestor visual de base de datos.

## Reglas generales
- No subir archivos .env.
- Mantener .env.example actualizado.
- No cambiar nombres de tablas o modelos sin justificarlo.
- Usar TypeScript estricto.
- Mantener DTOs y validaciones en backend.
- Mantener servicios API separados en frontend.
- Actualizar README.md cuando se agreguen comandos o flujos importantes.

## Base de datos
- PostgreSQL corre por Docker en localhost:5434.
- La conexión se revisa con TablePlus.
- Las migraciones deben manejarse con Prisma.
- El seed debe poder ejecutarse sin duplicar datos críticos.

## Comandos comunes backend
- yarn install
- yarn start:dev
- yarn prisma:generate
- yarn prisma:migrate
- yarn prisma:seed
- yarn prisma:studio

## Comandos comunes frontend
- yarn install
- yarn dev
- yarn build

## Antes de terminar una tarea
- Verificar que compile.
- Verificar que no existan errores de TypeScript.
- Verificar que README.md esté actualizado.
- Explicar qué archivos se modificaron.
