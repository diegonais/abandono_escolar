import { type PaginatedResponse } from "@/types/pagination";

export type EnrollmentStatus = "ACTIVE" | "INACTIVE";

export interface EnrollmentStudent {
  id: string;
  firstName: string;
  lastName: string;
  ci: string | null;
}

export interface EnrollmentCourse {
  id: string;
  level: string;
  parallel: string;
  schoolYearId: string;
}

export interface EnrollmentSchoolYear {
  id: string;
  name: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  schoolYearId: string;
  status: EnrollmentStatus;
  student: EnrollmentStudent;
  course: EnrollmentCourse;
  schoolYear: EnrollmentSchoolYear;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentsQueryParams {
  page?: number;
  limit?: number;
  status?: EnrollmentStatus;
  schoolYearId?: string;
}

export type PaginatedEnrollmentsResponse = PaginatedResponse<Enrollment>;
