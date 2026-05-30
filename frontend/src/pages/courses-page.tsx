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
  createCourse,
  deleteCourse,
  getCourses,
  getSchoolYearOptions,
  updateCourse,
} from "@/services/api/courses.service";
import { type Course } from "@/types/courses";

const PAGE_SIZE = 10;

interface CourseFormValues {
  level: string;
  parallel: string;
  schoolYearId: string;
}

const EMPTY_FORM: CourseFormValues = {
  level: "",
  parallel: "",
  schoolYearId: "",
};

export function CoursesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [schoolYearFilter, setSchoolYearFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formValues, setFormValues] = useState<CourseFormValues>(EMPTY_FORM);

  const schoolYearsQuery = useQuery({
    queryKey: ["school-year-options"],
    queryFn: getSchoolYearOptions,
  });

  const coursesQuery = useQuery({
    queryKey: ["courses", page, schoolYearFilter],
    queryFn: () =>
      getCourses({
        page,
        limit: PAGE_SIZE,
        schoolYearId: schoolYearFilter || undefined,
      }),
  });

  const createCourseMutation = useMutation({
    mutationFn: createCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      closeModal();
    },
  });

  const updateCourseMutation = useMutation({
    mutationFn: ({ courseId, payload }: { courseId: string; payload: CourseFormValues }) =>
      updateCourse(courseId, {
        level: payload.level.trim(),
        parallel: payload.parallel.trim().toUpperCase(),
        schoolYearId: payload.schoolYearId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
      closeModal();
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: deleteCourse,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  const submitErrorMessage = (() => {
    if (createCourseMutation.error instanceof Error) {
      return createCourseMutation.error.message;
    }

    if (updateCourseMutation.error instanceof Error) {
      return updateCourseMutation.error.message;
    }

    return null;
  })();

  const actionErrorMessage = deleteCourseMutation.error instanceof Error
    ? deleteCourseMutation.error.message
    : null;

  const filteredCourses = useMemo(() => {
    const rows = coursesQuery.data?.data ?? [];
    const normalizedSearch = searchInput.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((course) => {
      const haystack = `${course.level} ${course.parallel} ${course.schoolYear.name}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [coursesQuery.data?.data, searchInput]);

  function openCreateModal() {
    setEditingCourse(null);
    setFormValues(EMPTY_FORM);
    createCourseMutation.reset();
    updateCourseMutation.reset();
    setIsModalOpen(true);
  }

  function openEditModal(course: Course) {
    setEditingCourse(course);
    setFormValues({
      level: course.level,
      parallel: course.parallel,
      schoolYearId: course.schoolYearId,
    });
    createCourseMutation.reset();
    updateCourseMutation.reset();
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingCourse(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formValues.level.trim() || !formValues.parallel.trim() || !formValues.schoolYearId) {
      return;
    }

    try {
      if (editingCourse) {
        await updateCourseMutation.mutateAsync({
          courseId: editingCourse.id,
          payload: formValues,
        });
        return;
      }

      await createCourseMutation.mutateAsync({
        level: formValues.level.trim(),
        parallel: formValues.parallel.trim().toUpperCase(),
        schoolYearId: formValues.schoolYearId,
      });
    } catch {
      // El estado de error se maneja con TanStack Query.
    }
  }

  async function handleDeleteCourse(course: Course) {
    if (!isAdmin) {
      return;
    }

    const confirmed = window.confirm(
      `Se eliminara el curso ${course.level} ${course.parallel}. Esta accion no se puede deshacer.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteCourseMutation.mutateAsync(course.id);
    } catch {
      // El estado de error se maneja con TanStack Query.
    }
  }

  const canSave = !createCourseMutation.isPending && !updateCourseMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Cursos</h2>
          <p className="text-sm text-slate-600">
            Gestion de cursos por nivel, paralelo y gestion escolar.
          </p>
        </div>

        {isAdmin ? (
          <Button type="button" onClick={openCreateModal} disabled={schoolYearsQuery.isLoading}>
            Crear curso
          </Button>
        ) : null}
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div>
            <CardTitle>Listado</CardTitle>
            <CardDescription>Busqueda basica por nivel, paralelo o gestion.</CardDescription>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_280px]">
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Buscar curso..."
            />

            <select
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
              value={schoolYearFilter}
              onChange={(event) => {
                setSchoolYearFilter(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas las gestiones</option>
              {(schoolYearsQuery.data ?? []).map((schoolYear) => (
                <option key={schoolYear.id} value={schoolYear.id}>
                  {schoolYear.name}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {coursesQuery.isLoading ? (
            <div className="px-6 pb-6">
              <LoadingState />
            </div>
          ) : null}

          {coursesQuery.isError ? (
            <div className="px-6 pb-6">
              <ErrorState
                title="No se pudo cargar cursos"
                description={
                  coursesQuery.error instanceof Error
                    ? coursesQuery.error.message
                    : "Ocurrio un error inesperado."
                }
                onRetry={() => coursesQuery.refetch()}
              />
            </div>
          ) : null}

          {!coursesQuery.isLoading && !coursesQuery.isError && coursesQuery.data ? (
            <>
              {filteredCourses.length === 0 ? (
                <div className="px-6 pb-6">
                  <EmptyState
                    title="Sin cursos para mostrar"
                    description="Prueba otro filtro o registra un nuevo curso."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] border-y border-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Nivel</th>
                        <th className="px-4 py-3">Paralelo</th>
                        <th className="px-4 py-3">Gestion</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCourses.map((course) => (
                        <tr key={course.id} className="border-t border-slate-100 text-slate-700">
                          <td className="px-4 py-3 font-medium text-slate-900">{course.level}</td>
                          <td className="px-4 py-3">{course.parallel}</td>
                          <td className="px-4 py-3">{course.schoolYear.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {isAdmin ? (
                                <>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openEditModal(course)}
                                  >
                                    Editar
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => void handleDeleteCourse(course)}
                                    disabled={deleteCourseMutation.isPending}
                                  >
                                    Eliminar
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
                meta={coursesQuery.data.meta}
                onPageChange={(nextPage) => setPage(nextPage)}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      {actionErrorMessage ? <p className="text-sm text-rose-700">{actionErrorMessage}</p> : null}

      <Modal
        isOpen={isModalOpen}
        title={editingCourse ? "Editar curso" : "Crear curso"}
        description="Define nivel, paralelo y gestion asociada."
        onClose={closeModal}
        footer={
          <>
            <Button type="button" variant="outline" onClick={closeModal} disabled={!canSave}>
              Cancelar
            </Button>
            <Button type="submit" form="course-form" disabled={!canSave || schoolYearsQuery.isLoading}>
              {createCourseMutation.isPending || updateCourseMutation.isPending
                ? "Guardando..."
                : editingCourse
                  ? "Guardar cambios"
                  : "Crear curso"}
            </Button>
          </>
        }
      >
        <form id="course-form" className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-700">
              <span>Nivel *</span>
              <Input
                value={formValues.level}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, level: event.target.value }))
                }
                required
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700">
              <span>Paralelo *</span>
              <Input
                value={formValues.parallel}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, parallel: event.target.value }))
                }
                required
              />
            </label>

            <label className="space-y-1 text-sm text-slate-700 sm:col-span-2">
              <span>Gestion escolar *</span>
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                value={formValues.schoolYearId}
                onChange={(event) =>
                  setFormValues((current) => ({ ...current, schoolYearId: event.target.value }))
                }
                required
              >
                <option value="">Selecciona una gestion</option>
                {(schoolYearsQuery.data ?? []).map((schoolYear) => (
                  <option key={schoolYear.id} value={schoolYear.id}>
                    {schoolYear.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {schoolYearsQuery.isError ? (
            <p className="text-sm text-rose-700">
              {schoolYearsQuery.error instanceof Error
                ? schoolYearsQuery.error.message
                : "No se pudo cargar las gestiones escolares."}
            </p>
          ) : null}

          {submitErrorMessage ? <p className="text-sm text-rose-700">{submitErrorMessage}</p> : null}
        </form>
      </Modal>
    </div>
  );
}
