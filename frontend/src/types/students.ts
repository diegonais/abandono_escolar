import { type PaginatedResponse } from "@/types/pagination";

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  ci: string | null;
  birthDate: string | null;
  gender: string | null;
  tutorName: string | null;
  tutorPhone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface CreateStudentPayload {
  firstName: string;
  lastName: string;
  ci?: string;
  birthDate?: string;
  gender?: string;
  tutorName?: string;
  tutorPhone?: string;
  address?: string;
  isActive?: boolean;
}

export interface UpdateStudentPayload {
  firstName?: string;
  lastName?: string;
  ci?: string;
  birthDate?: string;
  gender?: string;
  tutorName?: string;
  tutorPhone?: string;
  address?: string;
}

export type PaginatedStudentsResponse = PaginatedResponse<Student>;
