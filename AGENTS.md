# AGENTS

Guia inicial para colaborar en este repositorio.

## Objetivo del sistema
Desarrollar una plataforma web para identificar tempranamente riesgo de abandono escolar en estudiantes de secundaria de unidades educativas fiscales.

## Estado actual
- Estructura base de monorepo creada.
- Backend: NestJS + TypeScript + Prisma.
- Frontend: React + Vite + TypeScript + Tailwind + base shadcn/ui + Recharts.
- Base de datos PostgreSQL definida en Docker Compose.

## Convenciones iniciales
- Usar TypeScript en todo el proyecto.
- Mantener modulos pequenos y enfocados.
- Evitar logica compleja en la capa de presentacion.
- Documentar comandos y cambios relevantes en README.

## Proximos pasos sugeridos
- Implementar autenticacion y roles (admin/docente).
- Definir modelo de datos de estudiantes, asistencia y calificaciones.
- Crear motor de alertas preventivas por umbrales.
- Agregar pruebas unitarias y e2e.
