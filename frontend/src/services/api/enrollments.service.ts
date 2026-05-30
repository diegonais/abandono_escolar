import { apiClient } from "@/services/api/client";
import { toApiError } from "@/services/api/error";
import {
  type EnrollmentsQueryParams,
  type PaginatedEnrollmentsResponse,
} from "@/types/enrollments";

export async function getEnrollmentsByCourse(
  courseId: string,
  params?: EnrollmentsQueryParams,
): Promise<PaginatedEnrollmentsResponse> {
  try {
    const { data } = await apiClient.get<PaginatedEnrollmentsResponse>(
      `/enrollments/by-course/${courseId}`,
      { params },
    );
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo cargar la lista de estudiantes inscritos.");
  }
}
