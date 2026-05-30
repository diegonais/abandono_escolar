export const routePaths = {
  login: "/login",
  dashboard: "/dashboard",
  students: "/students",
  courses: "/courses",
  subjects: "/subjects",
  attendance: "/attendance",
  grades: "/grades",
  followUps: "/follow-ups",
  alerts: "/alerts",
  reports: "/reports",
} as const;

export const sidebarLinks = [
  { to: routePaths.dashboard, label: "Dashboard" },
  { to: routePaths.students, label: "Estudiantes" },
  { to: routePaths.courses, label: "Cursos" },
  { to: routePaths.subjects, label: "Materias" },
  { to: routePaths.attendance, label: "Asistencia" },
  { to: routePaths.grades, label: "Calificaciones" },
  { to: routePaths.followUps, label: "Seguimientos" },
  { to: routePaths.alerts, label: "Alertas" },
  { to: routePaths.reports, label: "Reportes" },
] as const;
