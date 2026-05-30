import { Navigate, createBrowserRouter } from "react-router-dom";
import { MainLayout } from "@/layouts/main-layout";
import { CoursesPage } from "@/pages/courses-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { LoginPage } from "@/pages/login-page";
import { PlaceholderPage } from "@/pages/placeholder-page";
import { StudentsPage } from "@/pages/students-page";
import { SubjectsPage } from "@/pages/subjects-page";
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
              { path: routePaths.students, element: <StudentsPage /> },
              { path: routePaths.courses, element: <CoursesPage /> },
              { path: routePaths.subjects, element: <SubjectsPage /> },
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
