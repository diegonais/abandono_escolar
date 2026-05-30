import { apiClient } from "@/services/api/client";
import { toApiError } from "@/services/api/error";
import {
  type CreateSubjectPayload,
  type PaginatedSubjectsResponse,
  type Subject,
  type SubjectsQueryParams,
  type UpdateSubjectPayload,
} from "@/types/subjects";

export async function getSubjects(
  params: SubjectsQueryParams,
): Promise<PaginatedSubjectsResponse> {
  try {
    const { data } = await apiClient.get<PaginatedSubjectsResponse>("/subjects", { params });
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo cargar la lista de materias.");
  }
}

export async function createSubject(payload: CreateSubjectPayload): Promise<Subject> {
  try {
    const { data } = await apiClient.post<Subject>("/subjects", payload);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo crear la materia.");
  }
}

export async function updateSubject(
  subjectId: string,
  payload: UpdateSubjectPayload,
): Promise<Subject> {
  try {
    const { data } = await apiClient.patch<Subject>(`/subjects/${subjectId}`, payload);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo actualizar la materia.");
  }
}

export async function deactivateSubject(subjectId: string): Promise<Subject> {
  try {
    const { data } = await apiClient.patch<Subject>(`/subjects/${subjectId}/deactivate`);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo desactivar la materia.");
  }
}
