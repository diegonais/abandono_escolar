import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback-states";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/features/auth/auth-context";
import {
  createAttendanceBulk,
  getAttendances,
  getAttendancesByCourse,
} from "@/services/api/attendance.service";
import { getCourses } from "@/services/api/courses.service";
import { getEnrollmentsByCourse } from "@/services/api/enrollments.service";
import { getStudents } from "@/services/api/students.service";
import { ATTENDANCE_STATUSES, type AttendanceQueryParams, type AttendanceStatus } from "@/types/attendance";
import { type Course } from "@/types/courses";
import { type Student } from "@/types/students";

const PAGE_SIZE = 100;

const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  PRESENTE: "Presente",
  FALTA: "Falta",
  ATRASO: "Atraso",
  JUSTIFICADO: "Justificado",
};

type MessageType = "success" | "error";

interface FeedbackMessage {
  type: MessageType;
  text: string;
}

interface AttendanceRosterRow {
  studentId: string;
  fullName: string;
  ci: string | null;
  existingStatus: AttendanceStatus | null;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureDate(date: string): boolean {
  if (!date) {
    return false;
  }

  return date > getTodayDateString();
}

function getStudentFullName(student: Student): string {
  return `${student.firstName} ${student.lastName}`.trim();
}

function getCourseLabel(course: Course): string {
  return `${course.level} ${course.parallel} - ${course.schoolYear.name}`;
}

function getStatusBadgeClass(status: AttendanceStatus): string {
  switch (status) {
    case "PRESENTE":
      return "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800";
    case "FALTA":
      return "rounded-full bg-rose-100 px-2 py-1 text-xs font-medium text-rose-800";
    case "ATRASO":
      return "rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800";
    case "JUSTIFICADO":
      return "rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700";
    default:
      return "rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700";
  }
}

async function getCourseOptions(): Promise<Course[]> {
  const courses: Course[] = [];
  let page = 1;

  while (true) {
    const response = await getCourses({ page, limit: PAGE_SIZE });
    courses.push(...response.data);

    if (response.meta.totalPages === 0 || page >= response.meta.totalPages) {
      break;
    }

    page += 1;
  }

  return courses.sort((a, b) => {
    const labelA = getCourseLabel(a).toLowerCase();
    const labelB = getCourseLabel(b).toLowerCase();
    return labelA.localeCompare(labelB);
  });
}

async function getStudentOptions(): Promise<Student[]> {
  const students: Student[] = [];
  let page = 1;

  while (true) {
    const response = await getStudents({ page, limit: PAGE_SIZE, isActive: true });
    students.push(...response.data);

    if (response.meta.totalPages === 0 || page >= response.meta.totalPages) {
      break;
    }

    page += 1;
  }

  return students.sort((a, b) => {
    const nameA = getStudentFullName(a).toLowerCase();
    const nameB = getStudentFullName(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

async function getActiveRosterByCourse(
  courseId: string,
  attendanceDate: string,
): Promise<AttendanceRosterRow[]> {
  const enrollments = [];
  let page = 1;

  while (true) {
    const response = await getEnrollmentsByCourse(courseId, {
      page,
      limit: PAGE_SIZE,
      status: "ACTIVE",
    });
    enrollments.push(...response.data);

    if (response.meta.totalPages === 0 || page >= response.meta.totalPages) {
      break;
    }

    page += 1;
  }

  const existingAttendances = await getAttendancesByCourse(courseId, {
    dateFrom: attendanceDate,
    dateTo: attendanceDate,
  });

  const existingByStudentId = new Map(
    existingAttendances.map((attendance) => [attendance.studentId, attendance.status] as const),
  );

  return enrollments
    .map((enrollment) => ({
      studentId: enrollment.student.id,
      fullName: `${enrollment.student.firstName} ${enrollment.student.lastName}`.trim(),
      ci: enrollment.student.ci,
      existingStatus: existingByStudentId.get(enrollment.student.id) ?? null,
    }))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export function AttendancePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const canRegisterAttendance = user?.role === "ADMIN" || user?.role === "DOCENTE";
  const todayDate = getTodayDateString();

  const [registerCourseId, setRegisterCourseId] = useState("");
  const [registerDate, setRegisterDate] = useState(todayDate);
  const [registerRows, setRegisterRows] = useState<AttendanceRosterRow[]>([]);
  const [rowStatuses, setRowStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [registerMessage, setRegisterMessage] = useState<FeedbackMessage | null>(null);
  const [registerValidationError, setRegisterValidationError] = useState<string | null>(null);
  const [hasLoadedRoster, setHasLoadedRoster] = useState(false);

  const [filterCourseId, setFilterCourseId] = useState("");
  const [filterStudentId, setFilterStudentId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterValidationError, setFilterValidationError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<AttendanceQueryParams>({});

  const coursesQuery = useQuery({
    queryKey: ["attendance-course-options"],
    queryFn: getCourseOptions,
  });

  const studentsQuery = useQuery({
    queryKey: ["attendance-student-options"],
    queryFn: getStudentOptions,
  });

  const loadRosterMutation = useMutation({
    mutationFn: ({ courseId, date }: { courseId: string; date: string }) =>
      getActiveRosterByCourse(courseId, date),
  });

  const saveBulkMutation = useMutation({
    mutationFn: createAttendanceBulk,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["attendance-list"] });
    },
  });

  const attendanceListQuery = useQuery({
    queryKey: ["attendance-list", appliedFilters],
    queryFn: () => getAttendances(appliedFilters),
  });

  const registerPendingCount = useMemo(
    () => registerRows.filter((row) => row.existingStatus === null).length,
    [registerRows],
  );

  const summary = useMemo(() => {
    const rows = attendanceListQuery.data ?? [];
    const totals = {
      total: rows.length,
      faltas: 0,
      atrasos: 0,
      presentes: 0,
      justificados: 0,
    };

    for (const row of rows) {
      if (row.status === "FALTA") {
        totals.faltas += 1;
      }

      if (row.status === "ATRASO") {
        totals.atrasos += 1;
      }

      if (row.status === "PRESENTE") {
        totals.presentes += 1;
      }

      if (row.status === "JUSTIFICADO") {
        totals.justificados += 1;
      }
    }

    return totals;
  }, [attendanceListQuery.data]);

  const registerErrorMessage = loadRosterMutation.error instanceof Error
    ? loadRosterMutation.error.message
    : saveBulkMutation.error instanceof Error
      ? saveBulkMutation.error.message
      : null;

  async function handleLoadRoster() {
    if (!registerCourseId) {
      setRegisterValidationError("Selecciona un curso para cargar estudiantes.");
      return;
    }

    if (!registerDate) {
      setRegisterValidationError("Selecciona una fecha valida.");
      return;
    }

    if (isFutureDate(registerDate)) {
      setRegisterValidationError("No se permite usar una fecha futura.");
      return;
    }

    setRegisterValidationError(null);
    setRegisterMessage(null);
    setHasLoadedRoster(false);

    try {
      const roster = await loadRosterMutation.mutateAsync({
        courseId: registerCourseId,
        date: registerDate,
      });
      const nextStatuses: Record<string, AttendanceStatus> = {};

      for (const row of roster) {
        if (row.existingStatus === null) {
          nextStatuses[row.studentId] = rowStatuses[row.studentId] ?? "PRESENTE";
        }
      }

      setRowStatuses(nextStatuses);
      setRegisterRows(roster);
      setHasLoadedRoster(true);
    } catch {
      // El estado de error se maneja con TanStack Query.
    }
  }

  async function handleSaveAttendance() {
    if (!canRegisterAttendance) {
      return;
    }

    if (isFutureDate(registerDate)) {
      setRegisterValidationError("No se permite usar una fecha futura.");
      return;
    }

    if (!hasLoadedRoster) {
      setRegisterValidationError("Primero carga la lista de estudiantes.");
      return;
    }

    const pendingRows = registerRows.filter((row) => row.existingStatus === null);

    if (pendingRows.length === 0) {
      setRegisterMessage({
        type: "error",
        text: "No hay asistencias pendientes para guardar en este curso y fecha.",
      });
      return;
    }

    const payload = pendingRows.map((row) => ({
      studentId: row.studentId,
      courseId: registerCourseId,
      date: registerDate,
      status: rowStatuses[row.studentId] ?? "PRESENTE",
    }));

    setRegisterValidationError(null);
    setRegisterMessage(null);

    try {
      const createdRecords = await saveBulkMutation.mutateAsync(payload);
      const createdByStudentId = new Map(
        createdRecords.map((record) => [record.studentId, record.status] as const),
      );

      setRegisterRows((currentRows) =>
        currentRows.map((row) => ({
          ...row,
          existingStatus: row.existingStatus ?? createdByStudentId.get(row.studentId) ?? null,
        })),
      );
      setRowStatuses({});
      setRegisterMessage({
        type: "success",
        text: `Se guardaron ${createdRecords.length} asistencias correctamente.`,
      });
    } catch {
      // El estado de error se maneja con TanStack Query.
    }
  }

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (filterDateFrom && isFutureDate(filterDateFrom)) {
      setFilterValidationError("La fecha desde no puede estar en el futuro.");
      return;
    }

    if (filterDateTo && isFutureDate(filterDateTo)) {
      setFilterValidationError("La fecha hasta no puede estar en el futuro.");
      return;
    }

    if (filterDateFrom && filterDateTo && filterDateFrom > filterDateTo) {
      setFilterValidationError("La fecha desde no puede ser mayor que la fecha hasta.");
      return;
    }

    setFilterValidationError(null);
    setAppliedFilters({
      courseId: filterCourseId || undefined,
      studentId: filterStudentId || undefined,
      dateFrom: filterDateFrom || undefined,
      dateTo: filterDateTo || undefined,
    });
  }

  function clearFilters() {
    setFilterCourseId("");
    setFilterStudentId("");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterValidationError(null);
    setAppliedFilters({});
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-slate-900">Asistencia</h2>
        <p className="text-sm text-slate-600">
          Registro por curso y fecha, con consulta historica y resumen de faltas y atrasos.
        </p>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Registro de asistencia</CardTitle>
            <CardDescription>
              Selecciona curso y fecha para cargar estudiantes inscritos y guardar en lote.
            </CardDescription>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              value={registerCourseId}
              onChange={(event) => {
                setRegisterCourseId(event.target.value);
                setHasLoadedRoster(false);
                setRegisterRows([]);
                setRowStatuses({});
                setRegisterMessage(null);
                setRegisterValidationError(null);
              }}
            >
              <option value="">Selecciona un curso</option>
              {(coursesQuery.data ?? []).map((course) => (
                <option key={course.id} value={course.id}>
                  {getCourseLabel(course)}
                </option>
              ))}
            </select>

            <Input
              type="date"
              value={registerDate}
              max={todayDate}
              onChange={(event) => {
                setRegisterDate(event.target.value);
                setHasLoadedRoster(false);
                setRegisterRows([]);
                setRowStatuses({});
                setRegisterMessage(null);
                setRegisterValidationError(null);
              }}
            />

            <Button
              type="button"
              variant="outline"
              onClick={() => void handleLoadRoster()}
              disabled={loadRosterMutation.isPending || coursesQuery.isLoading}
            >
              {loadRosterMutation.isPending ? "Cargando..." : "Cargar estudiantes"}
            </Button>

            <Button
              type="button"
              onClick={() => void handleSaveAttendance()}
              disabled={
                !canRegisterAttendance ||
                !hasLoadedRoster ||
                saveBulkMutation.isPending ||
                loadRosterMutation.isPending
              }
            >
              {saveBulkMutation.isPending ? "Guardando..." : "Guardar asistencia"}
            </Button>
          </div>

          {!canRegisterAttendance ? (
            <p className="text-sm text-amber-700">
              Tu rol solo tiene permisos de consulta para asistencias.
            </p>
          ) : null}

          {registerValidationError ? (
            <p className="text-sm text-rose-700">{registerValidationError}</p>
          ) : null}

          {registerErrorMessage ? <p className="text-sm text-rose-700">{registerErrorMessage}</p> : null}

          {registerMessage ? (
            <p className={registerMessage.type === "success" ? "text-sm text-emerald-700" : "text-sm text-rose-700"}>
              {registerMessage.text}
            </p>
          ) : null}
        </CardHeader>

        <CardContent className="p-0">
          {hasLoadedRoster && registerRows.length === 0 ? (
            <div className="px-6 pb-6">
              <EmptyState
                title="Sin estudiantes inscritos"
                description="Este curso no tiene inscripciones activas para registrar asistencia."
              />
            </div>
          ) : null}

          {hasLoadedRoster && registerRows.length > 0 ? (
            <>
              <div className="px-6 pb-4 text-sm text-slate-600">
                Pendientes por registrar: <strong>{registerPendingCount}</strong> de{" "}
                <strong>{registerRows.length}</strong>.
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-y border-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Estudiante</th>
                      <th className="px-4 py-3">CI</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registerRows.map((row) => (
                      <tr key={row.studentId} className="border-t border-slate-100 text-slate-700">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.fullName}</td>
                        <td className="px-4 py-3">{row.ci ?? "Sin CI"}</td>
                        <td className="px-4 py-3">
                          {row.existingStatus ? (
                            <span className={getStatusBadgeClass(row.existingStatus)}>
                              {ATTENDANCE_STATUS_LABELS[row.existingStatus]}
                            </span>
                          ) : (
                            <select
                              className="h-9 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                              value={rowStatuses[row.studentId] ?? "PRESENTE"}
                              onChange={(event) =>
                                setRowStatuses((current) => ({
                                  ...current,
                                  [row.studentId]: event.target.value as AttendanceStatus,
                                }))
                              }
                            >
                              {ATTENDANCE_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {ATTENDANCE_STATUS_LABELS[status]}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.existingStatus ? (
                            <span className="text-xs font-medium text-slate-500">Ya registrada</span>
                          ) : (
                            <span className="text-xs font-medium text-emerald-700">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Consulta y resumen</CardTitle>
            <CardDescription>
              Filtra por curso, estudiante y rango de fechas para revisar historial de asistencias.
            </CardDescription>
          </div>

          <form className="space-y-3" onSubmit={handleApplyFilters}>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                value={filterCourseId}
                onChange={(event) => setFilterCourseId(event.target.value)}
              >
                <option value="">Todos los cursos</option>
                {(coursesQuery.data ?? []).map((course) => (
                  <option key={course.id} value={course.id}>
                    {getCourseLabel(course)}
                  </option>
                ))}
              </select>

              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                value={filterStudentId}
                onChange={(event) => setFilterStudentId(event.target.value)}
              >
                <option value="">Todos los estudiantes</option>
                {(studentsQuery.data ?? []).map((student) => (
                  <option key={student.id} value={student.id}>
                    {getStudentFullName(student)}
                  </option>
                ))}
              </select>

              <Input
                type="date"
                value={filterDateFrom}
                max={todayDate}
                onChange={(event) => setFilterDateFrom(event.target.value)}
              />

              <Input
                type="date"
                value={filterDateTo}
                max={todayDate}
                onChange={(event) => setFilterDateTo(event.target.value)}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="outline">
                Aplicar filtros
              </Button>
              <Button type="button" variant="outline" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            </div>

            {filterValidationError ? (
              <p className="text-sm text-rose-700">{filterValidationError}</p>
            ) : null}
          </form>
        </CardHeader>

        <CardContent className="space-y-4 p-0">
          <div className="grid gap-3 px-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Total registros</p>
              <p className="mt-1 text-xl font-semibold text-slate-900">{summary.total}</p>
            </div>
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-rose-700">Faltas</p>
              <p className="mt-1 text-xl font-semibold text-rose-800">{summary.faltas}</p>
            </div>
            <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-amber-700">Atrasos</p>
              <p className="mt-1 text-xl font-semibold text-amber-800">{summary.atrasos}</p>
            </div>
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-700">Presentes</p>
              <p className="mt-1 text-xl font-semibold text-emerald-800">{summary.presentes}</p>
            </div>
          </div>

          {attendanceListQuery.isLoading ? (
            <div className="px-6 pb-6">
              <LoadingState />
            </div>
          ) : null}

          {attendanceListQuery.isError ? (
            <div className="px-6 pb-6">
              <ErrorState
                title="No se pudo cargar asistencias"
                description={
                  attendanceListQuery.error instanceof Error
                    ? attendanceListQuery.error.message
                    : "Ocurrio un error inesperado."
                }
                onRetry={() => attendanceListQuery.refetch()}
              />
            </div>
          ) : null}

          {!attendanceListQuery.isLoading && !attendanceListQuery.isError ? (
            attendanceListQuery.data && attendanceListQuery.data.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] border-y border-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">Estudiante</th>
                      <th className="px-4 py-3">Curso</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Observacion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceListQuery.data.map((attendance) => (
                      <tr key={attendance.id} className="border-t border-slate-100 text-slate-700">
                        <td className="px-4 py-3">{attendance.date.slice(0, 10)}</td>
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {attendance.student.firstName} {attendance.student.lastName}
                        </td>
                        <td className="px-4 py-3">
                          {attendance.course.level} {attendance.course.parallel}
                        </td>
                        <td className="px-4 py-3">
                          <span className={getStatusBadgeClass(attendance.status)}>
                            {ATTENDANCE_STATUS_LABELS[attendance.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3">{attendance.observation ?? "--"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 pb-6">
                <EmptyState
                  title="Sin asistencias para mostrar"
                  description="Ajusta los filtros o registra asistencia para visualizar resultados."
                />
              </div>
            )
          ) : null}
        </CardContent>
      </Card>

      {coursesQuery.isError ? (
        <p className="text-sm text-rose-700">
          {coursesQuery.error instanceof Error
            ? coursesQuery.error.message
            : "No se pudo cargar la lista de cursos."}
        </p>
      ) : null}

      {studentsQuery.isError ? (
        <p className="text-sm text-rose-700">
          {studentsQuery.error instanceof Error
            ? studentsQuery.error.message
            : "No se pudo cargar la lista de estudiantes."}
        </p>
      ) : null}
    </div>
  );
}
