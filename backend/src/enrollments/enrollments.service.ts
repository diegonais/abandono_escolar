import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  Course,
  EnrollmentStatus,
  Prisma,
  SchoolYear,
  Student,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import {
  EnrollmentResponseDto,
  PaginatedEnrollmentsResponseDto,
} from "./dto/enrollment-response.dto";
import { ListEnrollmentsQueryDto } from "./dto/list-enrollments-query.dto";
import { UpdateEnrollmentStatusDto } from "./dto/update-enrollment-status.dto";

type EnrollmentWithRelations = Prisma.EnrollmentGetPayload<{
  include: {
    student: true;
    course: true;
    schoolYear: true;
  };
}>;

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createEnrollmentDto: CreateEnrollmentDto): Promise<EnrollmentResponseDto> {
    const student = await this.findStudentById(createEnrollmentDto.studentId);
    const course = await this.findCourseById(createEnrollmentDto.courseId);
    const schoolYear = await this.findSchoolYearById(createEnrollmentDto.schoolYearId);

    if (!student) {
      throw new BadRequestException("El estudiante asociado no existe.");
    }

    if (!course) {
      throw new BadRequestException("El curso asociado no existe.");
    }

    if (!schoolYear) {
      throw new BadRequestException("La gestion escolar asociada no existe.");
    }

    if (course.schoolYearId !== createEnrollmentDto.schoolYearId) {
      throw new BadRequestException(
        "El curso no pertenece a la gestion escolar seleccionada.",
      );
    }

    await this.ensureEnrollmentIsAvailable(
      createEnrollmentDto.studentId,
      createEnrollmentDto.courseId,
      createEnrollmentDto.schoolYearId,
    );

    try {
      const enrollment = await this.prisma.enrollment.create({
        data: {
          studentId: createEnrollmentDto.studentId,
          courseId: createEnrollmentDto.courseId,
          schoolYearId: createEnrollmentDto.schoolYearId,
          status: createEnrollmentDto.status ?? EnrollmentStatus.ACTIVE,
        },
        include: {
          student: true,
          course: true,
          schoolYear: true,
        },
      });

      return this.toEnrollmentResponse(enrollment);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          "El estudiante ya esta inscrito en ese curso y gestion.",
        );
      }

      throw error;
    }
  }

  async findAll(query: ListEnrollmentsQueryDto): Promise<PaginatedEnrollmentsResponseDto> {
    return this.findByFilters({}, query);
  }

  async findByCourse(
    courseId: string,
    query: ListEnrollmentsQueryDto,
  ): Promise<PaginatedEnrollmentsResponseDto> {
    const course = await this.findCourseById(courseId);

    if (!course) {
      throw new NotFoundException("Curso no encontrado.");
    }

    return this.findByFilters({ courseId }, query);
  }

  async findByStudent(
    studentId: string,
    query: ListEnrollmentsQueryDto,
  ): Promise<PaginatedEnrollmentsResponseDto> {
    const student = await this.findStudentById(studentId);

    if (!student) {
      throw new NotFoundException("Estudiante no encontrado.");
    }

    return this.findByFilters({ studentId }, query);
  }

  async updateStatus(
    id: string,
    updateEnrollmentStatusDto: UpdateEnrollmentStatusDto,
  ): Promise<EnrollmentResponseDto> {
    await this.findEnrollmentByIdOrThrow(id);

    const updatedEnrollment = await this.prisma.enrollment.update({
      where: { id },
      data: { status: updateEnrollmentStatusDto.status },
      include: {
        student: true,
        course: true,
        schoolYear: true,
      },
    });

    return this.toEnrollmentResponse(updatedEnrollment);
  }

  private async findByFilters(
    baseWhere: Prisma.EnrollmentWhereInput,
    query: ListEnrollmentsQueryDto,
  ): Promise<PaginatedEnrollmentsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const where: Prisma.EnrollmentWhereInput = {
      ...baseWhere,
      ...(query.status ? { status: query.status } : {}),
      ...(query.schoolYearId ? { schoolYearId: query.schoolYearId } : {}),
    };

    const [total, enrollments] = await this.prisma.$transaction([
      this.prisma.enrollment.count({ where }),
      this.prisma.enrollment.findMany({
        where,
        include: {
          student: true,
          course: true,
          schoolYear: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: enrollments.map((enrollment) => this.toEnrollmentResponse(enrollment)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  private async ensureEnrollmentIsAvailable(
    studentId: string,
    courseId: string,
    schoolYearId: string,
    excludeEnrollmentId?: string,
  ): Promise<void> {
    const existingEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        studentId,
        courseId,
        schoolYearId,
      },
      select: { id: true },
    });

    if (existingEnrollment && existingEnrollment.id !== excludeEnrollmentId) {
      throw new ConflictException("El estudiante ya esta inscrito en ese curso y gestion.");
    }
  }

  private async findEnrollmentByIdOrThrow(id: string): Promise<EnrollmentWithRelations> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        student: true,
        course: true,
        schoolYear: true,
      },
    });

    if (!enrollment) {
      throw new NotFoundException("Inscripcion no encontrada.");
    }

    return enrollment;
  }

  private async findStudentById(id: string): Promise<Student | null> {
    return this.prisma.student.findUnique({
      where: { id },
    });
  }

  private async findCourseById(id: string): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { id },
    });
  }

  private async findSchoolYearById(id: string): Promise<SchoolYear | null> {
    return this.prisma.schoolYear.findUnique({
      where: { id },
    });
  }

  private isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  private toEnrollmentResponse(enrollment: EnrollmentWithRelations): EnrollmentResponseDto {
    return {
      id: enrollment.id,
      studentId: enrollment.studentId,
      courseId: enrollment.courseId,
      schoolYearId: enrollment.schoolYearId,
      status: enrollment.status,
      student: {
        id: enrollment.student.id,
        firstName: enrollment.student.firstName,
        lastName: enrollment.student.lastName,
        ci: enrollment.student.ci,
      },
      course: {
        id: enrollment.course.id,
        level: enrollment.course.level,
        parallel: enrollment.course.parallel,
        schoolYearId: enrollment.course.schoolYearId,
      },
      schoolYear: {
        id: enrollment.schoolYear.id,
        name: enrollment.schoolYear.name,
      },
      createdAt: enrollment.createdAt,
      updatedAt: enrollment.updatedAt,
    };
  }
}
