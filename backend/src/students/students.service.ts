import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, Student } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStudentDto } from "./dto/create-student.dto";
import { ListStudentsQueryDto } from "./dto/list-students-query.dto";
import {
  PaginatedStudentsResponseDto,
  StudentResponseDto,
} from "./dto/student-response.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListStudentsQueryDto): Promise<PaginatedStudentsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.StudentWhereInput = {};

    if (typeof query.isActive === "boolean") {
      where.isActive = query.isActive;
    }

    if (query.search) {
      where.OR = [
        {
          firstName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          ci: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [total, students] = await this.prisma.$transaction([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: students.map((student) => this.toStudentResponse(student)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<StudentResponseDto> {
    const student = await this.findStudentByIdOrThrow(id);
    return this.toStudentResponse(student);
  }

  async create(createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
    if (createStudentDto.ci) {
      await this.ensureCiIsAvailable(createStudentDto.ci);
    }

    try {
      const student = await this.prisma.student.create({
        data: {
          firstName: createStudentDto.firstName,
          lastName: createStudentDto.lastName,
          ci: createStudentDto.ci ?? null,
          birthDate: createStudentDto.birthDate ? new Date(createStudentDto.birthDate) : null,
          gender: createStudentDto.gender ?? null,
          tutorName: createStudentDto.tutorName ?? null,
          tutorPhone: createStudentDto.tutorPhone ?? null,
          address: createStudentDto.address ?? null,
          isActive: createStudentDto.isActive ?? true,
        },
      });

      return this.toStudentResponse(student);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException("Ya existe un estudiante con ese CI.");
      }

      throw error;
    }
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<StudentResponseDto> {
    const existingStudent = await this.findStudentByIdOrThrow(id);

    if (updateStudentDto.ci && updateStudentDto.ci !== existingStudent.ci) {
      await this.ensureCiIsAvailable(updateStudentDto.ci, id);
    }

    try {
      const updatedStudent = await this.prisma.student.update({
        where: { id },
        data: {
          ...(updateStudentDto.firstName ? { firstName: updateStudentDto.firstName } : {}),
          ...(updateStudentDto.lastName ? { lastName: updateStudentDto.lastName } : {}),
          ...(updateStudentDto.ci ? { ci: updateStudentDto.ci } : {}),
          ...(updateStudentDto.birthDate
            ? { birthDate: new Date(updateStudentDto.birthDate) }
            : {}),
          ...(updateStudentDto.gender ? { gender: updateStudentDto.gender } : {}),
          ...(updateStudentDto.tutorName ? { tutorName: updateStudentDto.tutorName } : {}),
          ...(updateStudentDto.tutorPhone ? { tutorPhone: updateStudentDto.tutorPhone } : {}),
          ...(updateStudentDto.address ? { address: updateStudentDto.address } : {}),
        },
      });

      return this.toStudentResponse(updatedStudent);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException("Ya existe un estudiante con ese CI.");
      }

      throw error;
    }
  }

  async deactivate(id: string): Promise<StudentResponseDto> {
    return this.updateStudentStatus(id, false);
  }

  async activate(id: string): Promise<StudentResponseDto> {
    return this.updateStudentStatus(id, true);
  }

  private async updateStudentStatus(
    id: string,
    isActive: boolean,
  ): Promise<StudentResponseDto> {
    const existingStudent = await this.findStudentByIdOrThrow(id);

    if (existingStudent.isActive === isActive) {
      return this.toStudentResponse(existingStudent);
    }

    const updatedStudent = await this.prisma.student.update({
      where: { id },
      data: { isActive },
    });

    return this.toStudentResponse(updatedStudent);
  }

  private async findStudentByIdOrThrow(id: string): Promise<Student> {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new NotFoundException("Estudiante no encontrado.");
    }

    return student;
  }

  private async ensureCiIsAvailable(ci: string, excludeStudentId?: string): Promise<void> {
    const existingStudent = await this.prisma.student.findFirst({
      where: {
        ci: {
          equals: ci,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existingStudent && existingStudent.id !== excludeStudentId) {
      throw new ConflictException("Ya existe un estudiante con ese CI.");
    }
  }

  private isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  private toStudentResponse(student: Student): StudentResponseDto {
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      ci: student.ci,
      birthDate: student.birthDate,
      gender: student.gender,
      tutorName: student.tutorName,
      tutorPhone: student.tutorPhone,
      address: student.address,
      isActive: student.isActive,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }
}
