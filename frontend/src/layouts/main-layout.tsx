import { LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { sidebarLinks } from "@/routes/route-config";
import { cn } from "@/lib/utils";

export function MainLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-r border-slate-200 bg-slate-50 px-4 py-6">
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Unidad educativa</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-900">abandono_escolar</h1>
            <p className="mt-1 text-sm text-slate-600">Monitoreo preventivo</p>
          </div>

          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  cn(
                    "block rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-slate-200 font-medium text-slate-900"
                      : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
                  )
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Sesion activa</p>
              <p className="text-sm font-medium text-slate-800">{user?.fullName ?? "Usuario"}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">{user?.role ?? "DOCENTE"}</span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Salir
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
