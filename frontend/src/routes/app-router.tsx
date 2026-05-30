import { Navigate, createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { PlaceholderPage } from "@/pages/placeholder-page";
import { ProtectedRoute } from "@/routes/protected-route";
import { routePaths } from "@/routes/route-config";

export const appRouter = createBrowserRouter([
  {
    path: routePaths.login,
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to={routePaths.dashboard} replace /> },
          { path: routePaths.dashboard, element: <DashboardPage /> },
          { path: routePaths.students, element: <PlaceholderPage title="Estudiantes" /> },
          { path: routePaths.courses, element: <PlaceholderPage title="Cursos" /> },
          { path: routePaths.subjects, element: <PlaceholderPage title="Materias" /> },
          { path: routePaths.attendance, element: <PlaceholderPage title="Asistencia" /> },
          { path: routePaths.grades, element: <PlaceholderPage title="Calificaciones" /> },
          { path: routePaths.followUps, element: <PlaceholderPage title="Seguimientos" /> },
          { path: routePaths.alerts, element: <PlaceholderPage title="Alertas" /> },
          { path: routePaths.reports, element: <PlaceholderPage title="Reportes" /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to={routePaths.dashboard} replace />,
  },
]);
