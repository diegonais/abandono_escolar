export const ATTENDANCE_STATUSES = [
  "PRESENTE",
  "FALTA",
  "ATRASO",
  "JUSTIFICADO",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export interface AttendanceStudent {
  id: string;
  firstName: string;
  lastName: string;
  ci: string | null;
}

export interface AttendanceCourse {
  id: string;
  level: string;
  parallel: string;
  schoolYearId: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
  observation: string | null;
  student: AttendanceStudent;
  course: AttendanceCourse;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAttendancePayload {
  studentId: string;
  courseId: string;
  date: string;
  status: AttendanceStatus;
  observation?: string;
}

export interface AttendanceQueryParams {
  dateFrom?: string;
  dateTo?: string;
  courseId?: string;
  studentId?: string;
  status?: AttendanceStatus;
}
