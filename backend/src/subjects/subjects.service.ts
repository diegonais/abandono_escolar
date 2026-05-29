import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Subject } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { ListSubjectsQueryDto } from "./dto/list-subjects-query.dto";
import {
  PaginatedSubjectsResponseDto,
  SubjectResponseDto,
} from "./dto/subject-response.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListSubjectsQueryDto): Promise<PaginatedSubjectsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.SubjectWhereInput = {};

    if (typeof query.isActive === "boolean") {
      where.isActive = query.isActive;
    }

    const [total, subjects] = await this.prisma.$transaction([
      this.prisma.subject.count({ where }),
      this.prisma.subject.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: subjects.map((subject) => this.toSubjectResponse(subject)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<SubjectResponseDto> {
    const subject = await this.findSubjectByIdOrThrow(id);
    return this.toSubjectResponse(subject);
  }

  async create(createSubjectDto: CreateSubjectDto): Promise<SubjectResponseDto> {
    await this.ensureSubjectNameIsAvailable(createSubjectDto.name);

    if (createSubjectDto.code) {
      await this.ensureSubjectCodeIsAvailable(createSubjectDto.code);
    }

    try {
      const subject = await this.prisma.subject.create({
        data: {
          name: createSubjectDto.name,
          code: createSubjectDto.code ?? null,
          isActive: createSubjectDto.isActive ?? true,
        },
      });

      return this.toSubjectResponse(subject);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException("Ya existe una materia con ese codigo.");
      }

      throw error;
    }
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto): Promise<SubjectResponseDto> {
    const existingSubject = await this.findSubjectByIdOrThrow(id);

    if (updateSubjectDto.name && updateSubjectDto.name !== existingSubject.name) {
      await this.ensureSubjectNameIsAvailable(updateSubjectDto.name, id);
    }

    if (updateSubjectDto.code && updateSubjectDto.code !== existingSubject.code) {
      await this.ensureSubjectCodeIsAvailable(updateSubjectDto.code, id);
    }

    try {
      const updatedSubject = await this.prisma.subject.update({
        where: { id },
        data: {
          ...(updateSubjectDto.name ? { name: updateSubjectDto.name } : {}),
          ...(updateSubjectDto.code ? { code: updateSubjectDto.code } : {}),
          ...(typeof updateSubjectDto.isActive === "boolean"
            ? { isActive: updateSubjectDto.isActive }
            : {}),
        },
      });

      return this.toSubjectResponse(updatedSubject);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException("Ya existe una materia con ese codigo.");
      }

      throw error;
    }
  }

  async deactivate(id: string): Promise<SubjectResponseDto> {
    const existingSubject = await this.findSubjectByIdOrThrow(id);

    if (!existingSubject.isActive) {
      return this.toSubjectResponse(existingSubject);
    }

    const deactivatedSubject = await this.prisma.subject.update({
      where: { id },
      data: { isActive: false },
    });

    return this.toSubjectResponse(deactivatedSubject);
  }

  private async ensureSubjectNameIsAvailable(
    name: string,
    excludeSubjectId?: string,
  ): Promise<void> {
    const existingSubject = await this.prisma.subject.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existingSubject && existingSubject.id !== excludeSubjectId) {
      throw new ConflictException("Ya existe una materia con ese nombre.");
    }
  }

  private async ensureSubjectCodeIsAvailable(
    code: string,
    excludeSubjectId?: string,
  ): Promise<void> {
    const existingSubject = await this.prisma.subject.findFirst({
      where: {
        code: {
          equals: code,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existingSubject && existingSubject.id !== excludeSubjectId) {
      throw new ConflictException("Ya existe una materia con ese codigo.");
    }
  }

  private async findSubjectByIdOrThrow(id: string): Promise<Subject> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      throw new NotFoundException("Materia no encontrada.");
    }

    return subject;
  }

  private isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  private toSubjectResponse(subject: Subject): SubjectResponseDto {
    return {
      id: subject.id,
      name: subject.name,
      code: subject.code,
      isActive: subject.isActive,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  }
}
