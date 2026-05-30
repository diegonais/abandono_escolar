import { type PaginatedResponse } from "@/types/pagination";

export interface Subject {
  id: string;
  name: string;
  code: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectsQueryParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export interface CreateSubjectPayload {
  name: string;
  code?: string;
  isActive?: boolean;
}

export interface UpdateSubjectPayload {
  name?: string;
  code?: string;
  isActive?: boolean;
}

export type PaginatedSubjectsResponse = PaginatedResponse<Subject>;
