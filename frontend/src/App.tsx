import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Button } from "@/components/ui/button";

const trendData = [
  { month: "Ene", risk: 8 },
  { month: "Feb", risk: 10 },
  { month: "Mar", risk: 9 },
  { month: "Abr", risk: 13 },
  { month: "May", risk: 12 },
];

function App() {
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto grid w-full max-w-5xl gap-6">
        <header className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Sistema preventivo</p>
          <h1 className="mt-1 text-2xl font-bold">abandono_escolar</h1>
          <p className="mt-2 text-sm text-slate-600">
            Estructura inicial de interfaz para monitoreo temprano de riesgo de abandono escolar.
          </p>
          <div className="mt-4">
            <Button>Ver estudiantes en riesgo</Button>
          </div>
        </header>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Tendencia de riesgo (demo)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="4 4" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="risk" stroke="#2563eb" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </main>
  );
}

export default App;
