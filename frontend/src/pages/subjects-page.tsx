import { type FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback-states";
import { PaginationControls } from "@/components/pagination-controls";
import { useAuth } from "@/features/auth/auth-context";
import {
  createSubject,
  deactivateSubject,
  getSubjects,
  updateSubject,
} from "@/services/api/subjects.service";
import { type Subject } from "@/types/subjects";

const PAGE_SIZE = 10;

interface SubjectFormValues {
  name: string;
  code: string;
}

const EMPTY_FORM: SubjectFormValues = {
  name: "",
  code: "",
};

function trimToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function SubjectsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [formValues, setFormValues] = useState<SubjectFormValues>(EMPTY_FORM);

  const subjectsQuery = useQuery({
    queryKey: ["subjects", page, statusFilter],
    queryFn: () =>
      getSubjects({
        page,
        limit: PAGE_SIZE,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
      }),
  });

  const createSubjectMutation = useMutation({
    mutationFn: createSubject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
      closeModal();
    },
  });

  const updateSubjectMutation = useMutation({
    mutationFn: ({ subjectId, payload }: { subjectId: string; payload: SubjectFormValues }) =>
      updateSubject(subjectId, {
        name: payload.name.trim(),
        code: trimToUndefined(payload.code)?.toUpperCase(),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
      closeModal();
    },
  });

  const deactivateSubjectMutation = useMutation({
    mutationFn: deactivateSubject,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });

  const filteredSubjects = useMemo(() => {
    const rows = subjectsQuery.data?.data ?? [];
    const normalizedSearch = searchInput.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((subject) => {
      const haystack = `${subject.name} ${subject.code ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [subjectsQuery.data?.data, searchInput]);

  const submitErrorMessage = (() => {
    if (createSubjectMutation.error instanceof Error) {
      return createSubjectMutation.error.message;
    }

    if (updateSubjectMutation.error instanceof Error) {
      return updateSubjectMutation.error.message;
    }

    return null;
  })();

  const actionErrorMessage = deactivateSubjectMutation.error instanceof Error
    ? deactivateSubjectMutation.error.message
    : null;

  function openCreateModal() {
    setEditingSubject(null);
    setFormValues(EMPTY_FORM);
    createSubjectMutation.reset();
    updateSubjectMutation.reset();
    setIsModalOpen(true);
  }

  function openEditModal(subject: Subject) {
    setEditingSubject(subject);
    setFormValues({
      name: subject.name,
      code: subject.code ?? "",
    });
    createSubjectMutation.reset();
    updateSubjectMutation.reset();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingSubject(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.name.trim()) {
      return;
    }

    try {
      if (editingSubject) {
        await updateSubjectMutation.mutateAsync({
          subjectId: editingSubject.id,
          payload: formValues,
        });
        return;
      }

      await createSubjectMutation.mutateAsync({
        name: formValues.name.trim(),
        code: trimToUndefined(formValues.code)?.toUpperCase(),
      });
    } catch {
      // El estado de error se maneja con TanStack Query.
    }
  }

  async function handleDeactivate(subject: Subject) {
    if (!isAdmin || !subject.isActive) {
      return;
    }

    const confirmed = window.confirm(
      `Se desactivara la materia ${subject.name}. Deseas continuar?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deactivateSubjectMutation.mutateAsync(subject.id);
    } catch {
      // El estado de error se maneja con TanStack Query.
    }
  }

  const canSubmit = !createSubjectMutation.isPending && !updateSubjectMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Materias</h2>
          <p className="text-sm text-slate-600">
            Gestion de materias con creacion, edicion y desactivacion.
          </p>
        </div>

        {isAdmin ? (
          <Button type="button" onClick={openCreateModal}>
            Crear materia
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Listado</CardTitle>
            <CardDescription>Busqueda basica por nombre o codigo.</CardDescription>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar materia..."
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
          {subjectsQuery.isLoading ? (
            <div className="px-6 pb-6">
              <LoadingState />
            </div>
          ) : null}

          {subjectsQuery.isError ? (
            <div className="px-6 pb-6">
              <ErrorState
                title="No se pudo cargar materias"
                description={
                  subjectsQuery.error instanceof Error
                    ? subjectsQuery.error.message
                    : "Ocurrio un error inesperado."
                }
                onRetry={() => subjectsQuery.refetch()}
              />
            </div>
          ) : null}

          {!subjectsQuery.isLoading && !subjectsQuery.isError && subjectsQuery.data ? (
            <>
              {filteredSubjects.length === 0 ? (
                <div className="px-6 pb-6">
                  <EmptyState
                    title="Sin materias para mostrar"
                    description="Prueba con otro filtro o registra una nueva materia."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] border-y border-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Nombre</th>
                        <th className="px-4 py-3">Codigo</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSubjects.map((subject) => (
                        <tr key={subject.id} className="border-t border-slate-100 text-slate-700">
                          <td className="px-4 py-3 font-medium text-slate-900">{subject.name}</td>
                          <td className="px-4 py-3">{subject.code ?? "Sin codigo"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={
                                subject.isActive
                                  ? "rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800"
                                  : "rounded-full bg-slate-200 px-2 py-1 text-xs font-medium text-slate-700"
                              }
                            >
                              {subject.isActive ? "Activa" : "Inactiva"}
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
                                    onClick={() => openEditModal(subject)}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleDeactivate(subject)}
                                    disabled={!subject.isActive || deactivateSubjectMutation.isPending}
                                  >
                                    Desactivar
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
                meta={subjectsQuery.data.meta}
                onPageChange={(nextPage) => setPage(nextPage)}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      {actionErrorMessage ? <p className="text-sm text-rose-700">{actionErrorMessage}</p> : null}

      <Modal
        isOpen={isModalOpen}
        title={editingSubject ? "Editar materia" : "Crear materia"}
        description="Completa la informacion principal de la materia."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal} disabled={!canSubmit}>
              Cancelar
            </Button>
            <Button type="submit" form="subject-form" disabled={!canSubmit}>
              {createSubjectMutation.isPending || updateSubjectMutation.isPending
                ? "Guardando..."
                : editingSubject
                  ? "Guardar cambios"
                  : "Crear materia"}
            </Button>
          </>
        }
      >
        <form id="subject-form" className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              <span>Nombre *</span>
              <Input
                value={formValues.name}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>Codigo</span>
              <Input
                value={formValues.code}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, code: event.target.value }))
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
