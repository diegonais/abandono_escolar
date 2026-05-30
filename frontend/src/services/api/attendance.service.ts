import { apiClient } from "@/services/api/client";
import { toApiError } from "@/services/api/error";
import {
  type AttendanceQueryParams,
  type AttendanceRecord,
  type CreateAttendancePayload,
} from "@/types/attendance";

export async function getAttendances(params?: AttendanceQueryParams): Promise<AttendanceRecord[]> {
  try {
    const { data } = await apiClient.get<AttendanceRecord[]>("/attendance", { params });
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo cargar la lista de asistencias.");
  }
}

export async function getAttendancesByCourse(
  courseId: string,
  params?: AttendanceQueryParams,
): Promise<AttendanceRecord[]> {
  try {
    const { data } = await apiClient.get<AttendanceRecord[]>(`/attendance/by-course/${courseId}`, {
      params,
    });
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo cargar las asistencias del curso.");
  }
}

export async function createAttendanceBulk(
  payload: CreateAttendancePayload[],
): Promise<AttendanceRecord[]> {
  try {
    const { data } = await apiClient.post<AttendanceRecord[]>("/attendance/bulk", payload);
    return data;
  } catch (error) {
    throw toApiError(error, "No se pudo guardar la asistencia del curso.");
  }
}
