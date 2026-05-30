import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback-states";
import { PaginationControls } from "@/components/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import {
  activateStudent,
  createStudent,
  deactivateStudent,
  getStudents,
  updateStudent,
} from "@/services/api/students.service";
import { type CreateStudentPayload, type Student, type UpdateStudentPayload } from "@/types/students";

const PAGE_SIZE = 10;

interface StudentFormValues {
  firstName: string;
  lastName: string;
  ci: string;
  birthDate: string;
  gender: string;
  tutorName: string;
  tutorPhone: string;
  address: string;
}

const EMPTY_FORM: StudentFormValues = {
  firstName: "",
  lastName: "",
  ci: "",
  birthDate: "",
  gender: "",
  tutorName: "",
  tutorPhone: "",
  address: "",
};

function trimToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeStudentPayload(values: StudentFormValues): CreateStudentPayload {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    ci: trimToUndefined(values.ci),
    birthDate: trimToUndefined(values.birthDate),
    gender: trimToUndefined(values.gender),
    tutorName: trimToUndefined(values.tutorName),
    tutorPhone: trimToUndefined(values.tutorPhone),
    address: trimToUndefined(values.address),
  };
}

function getStudentFullName(student: Student): string {
  return `${student.firstName} ${student.lastName}`.trim();
}

export function StudentsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formValues, setFormValues] = useState<StudentFormValues>(EMPTY_FORM);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  const studentsQuery = useQuery({
    queryKey: ["students", page, search, statusFilter],
    queryFn: () =>
      getStudents({
        page,
        limit: PAGE_SIZE,
        search: search.length > 0 ? search : undefined,
        isActive:
          statusFilter === "all" ? undefined : statusFilter === "active",
      }),
  });

  const createStudentMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      closeModal();
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: ({ studentId, payload }: { studentId: string; payload: UpdateStudentPayload }) =>
      updateStudent(studentId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      closeModal();
    },
  });

  const deactivateStudentMutation = useMutation({
    mutationFn: deactivateStudent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const activateStudentMutation = useMutation({
    mutationFn: activateStudent,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });

  const isSubmitting =
    createStudentMutation.isPending || updateStudentMutation.isPending;

  const submitErrorMessage = useMemo(() => {
    if (createStudentMutation.error instanceof Error) {
      return createStudentMutation.error.message;
    }

    if (updateStudentMutation.error instanceof Error) {
      return updateStudentMutation.error.message;
    }

    return null;
  }, [createStudentMutation.error, updateStudentMutation.error]);

  function openCreateModal() {
    setEditingStudent(null);
    setFormValues(EMPTY_FORM);
    createStudentMutation.reset();
    updateStudentMutation.reset();
    setIsModalOpen(true);
  }

  function openEditModal(student: Student) {
    setEditingStudent(student);
    setFormValues({
      firstName: student.firstName,
      lastName: student.lastName,
      ci: student.ci ?? "",
      birthDate: student.birthDate ? student.birthDate.slice(0, 10) : "",
      gender: student.gender ?? "",
      tutorName: student.tutorName ?? "",
      tutorPhone: student.tutorPhone ?? "",
      address: student.address ?? "",
    });
    createStudentMutation.reset();
    updateStudentMutation.reset();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingStudent(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.firstName.trim() || !formValues.lastName.trim()) {
      return;
    }

    const payload = normalizeStudentPayload(formValues);

    try {
      if (editingStudent) {
        await updateStudentMutation.mutateAsync({
          studentId: editingStudent.id,
          payload,
        });
        return;
      }

      await createStudentMutation.mutateAsync(payload);
    } catch {
      // El estado de error se maneja con TanStack Query.
    }
  }

  async function handleToggleStatus(student: Student) {
    if (!isAdmin) {
      return;
    }

    const shouldActivate = !student.isActive;
    const message = shouldActivate
      ? "Se activara este estudiante. Deseas continuar?"
      : "Se desactivara este estudiante. Deseas continuar?";

    if (!window.confirm(message)) {
      return;
    }

    try {
      if (shouldActivate) {
        await activateStudentMutation.mutateAsync(student.id);
        return;
      }

      await deactivateStudentMutation.mutateAsync(student.id);
    } catch {
      // El estado de error se maneja con TanStack Query.
    }
  }

  const mutationErrorMessage = (() => {
    if (deactivateStudentMutation.error instanceof Error) {
      return deactivateStudentMutation.error.message;
    }

    if (activateStudentMutation.error instanceof Error) {
      return activateStudentMutation.error.message;
    }

    return null;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Estudiantes</h2>
          <p className="text-sm text-slate-600">
            Gestion de estudiantes con busqueda, edicion y control de estado.
          </p>
        </div>

        {isAdmin ? (
          <Button type="button" onClick={openCreateModal}>
            Crear estudiante
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Listado</CardTitle>
            <CardDescription>Busca por nombre, apellido o CI.</CardDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar estudiante..."
            />

            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              value={statusFilter}
              onChange={(event) => {
                const nextFilter = event.target.value as "all" | "active" | "inactive";
                setStatusFilter(nextFilter);
                setPage(1);
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Solo activos</option>
              <option value="inactive">Solo inactivos</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {studentsQuery.isLoading ? (
            <div className="px-6 pb-6">
              <LoadingState />
            </div>
          ) : null}

          {studentsQuery.isError ? (
            <div className="px-6 pb-6">
              <ErrorState
                title="No se pudo cargar estudiantes"
                description={
                  studentsQuery.error instanceof Error
                    ? studentsQuery.error.message
                    : "Ocurrio un error inesperado."
                }
                onRetry={() => studentsQuery.refetch()}
              />
            </div>
          ) : null}

          {!studentsQuery.isLoading && !studentsQuery.isError && studentsQuery.data ? (
            <>
              {studentsQuery.data.data.length === 0 ? (
                <div className="px-6 pb-6">
                  <EmptyState
                    title="Sin estudiantes para mostrar"
                    description="Prueba con otro termino de busqueda o crea un nuevo estudiante."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-y border-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Nombre completo</th>
                        <th className="px-4 py-3">CI</th>
                        <th className="px-4 py-3">Tutor</th>
                        <th className="px-4 py-3">Telefono</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsQuery.data.data.map((student) => (
                        <tr key={student.id} className="border-t border-slate-100 text-slate-700">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {getStudentFullName(student)}
                          </td>
                          <td className="px-4 py-3">{student.ci ?? "Sin CI"}</td>
                          <td className="px-4 py-3">{student.tutorName ?? "Sin tutor"}</td>
                          <td className="px-4 py-3">{student.tutorPhone ?? "--"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                student.isActive
                                  ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
                                  : "rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700"
                              }
                            >
                              {student.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {isAdmin ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditModal(student)}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleToggleStatus(student)}
                                    disabled={
                                      deactivateStudentMutation.isPending ||
                                      activateStudentMutation.isPending
                                    }
                                  >
                                    {student.isActive ? "Desactivar" : "Activar"}
                                  </Button>
                                </>
                              ) : (
                                <span className="text-xs text-slate-500">Solo lectura</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <PaginationControls
                meta={studentsQuery.data.meta}
                onPageChange={(nextPage) => setPage(nextPage)}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      {mutationErrorMessage ? (
        <p className="text-sm text-rose-700">{mutationErrorMessage}</p>
      ) : null}

      <Modal
        isOpen={isModalOpen}
        title={editingStudent ? "Editar estudiante" : "Crear estudiante"}
        description="Completa los datos principales del estudiante."
        onClose={closeModal}
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" form="student-form" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : editingStudent ? "Guardar cambios" : "Crear estudiante"}
            </Button>
          </>
        }
      >
        <form id="student-form" className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              <span>Nombre *</span>
              <Input
                value={formValues.firstName}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, firstName: event.target.value }))
                }
                required
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>Apellido *</span>
              <Input
                value={formValues.lastName}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, lastName: event.target.value }))
                }
                required
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>CI</span>
              <Input
                value={formValues.ci}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, ci: event.target.value }))
                }
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>Fecha de nacimiento</span>
              <Input
                type="date"
                value={formValues.birthDate}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, birthDate: event.target.value }))
                }
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>Genero</span>
              <Input
                value={formValues.gender}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, gender: event.target.value }))
                }
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>Tutor</span>
              <Input
                value={formValues.tutorName}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, tutorName: event.target.value }))
                }
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>Telefono del tutor</span>
              <Input
                value={formValues.tutorPhone}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, tutorPhone: event.target.value }))
                }
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
              <span>Direccion</span>
              <Input
                value={formValues.address}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, address: event.target.value }))
                }
              />
            </label>
          </div>

          {submitErrorMessage ? <p className="text-sm text-rose-700">{submitErrorMessage}</p> : null}
        </form>
      </Modal>
    </div>
  );
}
