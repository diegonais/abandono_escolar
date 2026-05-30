import { useQuery } from "@tanstack/react-query";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardReport } from "@/services/api/reports.service";

const RISK_COLORS = ["#16a34a", "#f59e0b", "#f97316", "#dc2626"];

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard-report"],
    queryFn: getDashboardReport,
  });

  const riskDistribution = [
    { name: "Sin riesgo", value: data?.distribucionRiesgo.totalSinRiesgo ?? 0 },
    { name: "Riesgo bajo", value: data?.distribucionRiesgo.totalRiesgoBajo ?? 0 },
    { name: "Riesgo medio", value: data?.distribucionRiesgo.totalRiesgoMedio ?? 0 },
    { name: "Riesgo alto", value: data?.distribucionRiesgo.totalRiesgoAlto ?? 0 },
  ];

  const totalRiskStudents = riskDistribution.reduce((total, entry) => total + entry.value, 0);

  const cards = [
    { label: "Total estudiantes", value: data?.totalEstudiantes ?? 0 },
    { label: "Estudiantes con riesgo", value: data?.estudiantesConRiesgo ?? 0 },
    { label: "Alertas pendientes", value: data?.alertasPendientes ?? 0 },
    { label: "Promedio general", value: data ? data.promedioGeneral.toFixed(2) : "0.00" },
    {
      label: "Estudiantes con asistencia irregular",
      value: data?.estudiantesConAsistenciaIrregular ?? 0,
    },
    {
      label: "Estudiantes con bajo rendimiento",
      value: data?.estudiantesConBajoRendimiento ?? 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-600">Vista general para monitoreo academico y preventivo.</p>
      </div>

      {isError ? (
        <Card>
          <CardHeader>
            <CardTitle>No se pudo cargar el dashboard</CardTitle>
            <CardDescription>
              {error instanceof Error ? error.message : "Ocurrio un error al obtener los reportes."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetch()} disabled={isRefetching}>
              {isRefetching ? "Reintentando..." : "Reintentar"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-2xl">{isLoading ? "..." : card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribucion de riesgo</CardTitle>
          <CardDescription>Resumen de niveles de riesgo segun la ultima evaluacion por estudiante.</CardDescription>
        </CardHeader>
        <CardContent>
          {totalRiskStudents > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={riskDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {riskDistribution.map((entry, index) => (
                      <Cell key={entry.name} fill={RISK_COLORS[index % RISK_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-sm text-slate-600">
              Aun no hay datos suficientes para mostrar la distribucion de riesgo.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
