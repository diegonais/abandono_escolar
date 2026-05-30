import { apiClient } from "@/services/api/client";
import { toApiError } from "@/services/api/error";
import {
  type Course,
  type CoursesQueryParams,
  type CreateCoursePayload,
  type PaginatedCoursesResponse,
  type SchoolYearOption,
  type UpdateCoursePayload,
} from "@/types/courses";
import { type PaginatedResponse } from "@/types/pagination";

interface SchoolYearResponse {
  id: string;
  name: string;
  isActive: boolean;
}

export async function getCourses(params: CoursesQueryParams): Promise<PaginatedCoursesResponse> {
  try {
    const { data } = await apiClient.get<PaginatedCoursesResponse>("/courses", { params });
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo cargar la lista de cursos.");
  }
}

export async function getSchoolYearOptions(): Promise<SchoolYearOption[]> {
  try {
    const { data } = await apiClient.get<PaginatedResponse<SchoolYearResponse>>("/school-years", {
      params: {
        page: 1,
        limit: 100,
        isActive: true,
      },
    });

    return data.data;
  } catch (error) {
    throw toApiError(error, "No se pudo cargar la lista de gestiones escolares.");
  }
}

export async function createCourse(payload: CreateCoursePayload): Promise<Course> {
  try {
    const { data } = await apiClient.post<Course>("/courses", payload);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo crear el curso.");
  }
}

export async function updateCourse(courseId: string, payload: UpdateCoursePayload): Promise<Course> {
  try {
    const { data } = await apiClient.patch<Course>(`/courses/${courseId}`, payload);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo actualizar el curso.");
  }
}

export async function deleteCourse(courseId: string): Promise<Course> {
  try {
    const { data } = await apiClient.delete<Course>(`/courses/${courseId}`);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo eliminar el curso.");
  }
}
