import { apiClient } from "@/services/api/client";
import { toApiError } from "@/services/api/error";
import {
  type CreateStudentPayload,
  type PaginatedStudentsResponse,
  type Student,
  type StudentsQueryParams,
  type UpdateStudentPayload,
} from "@/types/students";

export async function getStudents(
  params: StudentsQueryParams,
): Promise<PaginatedStudentsResponse> {
  try {
    const { data } = await apiClient.get<PaginatedStudentsResponse>("/students", { params });
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo cargar la lista de estudiantes.");
  }
}

export async function createStudent(payload: CreateStudentPayload): Promise<Student> {
  try {
    const { data } = await apiClient.post<Student>("/students", payload);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo crear el estudiante.");
  }
}

export async function updateStudent(
  studentId: string,
  payload: UpdateStudentPayload,
): Promise<Student> {
  try {
    const { data } = await apiClient.patch<Student>(`/students/${studentId}`, payload);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo actualizar el estudiante.");
  }
}

export async function deactivateStudent(studentId: string): Promise<Student> {
  try {
    const { data } = await apiClient.patch<Student>(`/students/${studentId}/deactivate`);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo desactivar el estudiante.");
  }
}

export async function activateStudent(studentId: string): Promise<Student> {
  try {
    const { data } = await apiClient.patch<Student>(`/students/${studentId}/activate`);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo activar el estudiante.");
  }
}
