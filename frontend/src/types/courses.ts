import { type PaginatedResponse } from "@/types/pagination";

export interface SchoolYearOption {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CourseSchoolYear {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  level: string;
  parallel: string;
  schoolYearId: string;
  schoolYear: CourseSchoolYear;
  createdAt: string;
  updatedAt: string;
}

export interface CoursesQueryParams {
  page?: number;
  limit?: number;
  schoolYearId?: string;
}

export interface CreateCoursePayload {
  level: string;
  parallel: string;
  schoolYearId: string;
}

export interface UpdateCoursePayload {
  level?: string;
  parallel?: string;
  schoolYearId?: string;
}

export type PaginatedCoursesResponse = PaginatedResponse<Course>;
