import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { FollowUpType, Prisma, RoleName, Student } from "@prisma/client";
import { AuthUser } from "../auth/types/auth-user.type";
import { PrismaService } from "../prisma/prisma.service";
import { CreateStudentFollowUpDto } from "./dto/create-student-follow-up.dto";
import { ListStudentFollowUpsQueryDto } from "./dto/list-student-follow-ups-query.dto";
import {
  StudentFollowUpResponseDto,
  StudentFollowUpsSummaryResponseDto,
} from "./dto/student-follow-up-response.dto";
import { UpdateStudentFollowUpDto } from "./dto/update-student-follow-up.dto";

type StudentFollowUpWithRelations = Prisma.StudentFollowUpGetPayload<{
  include: {
    student: true;
    responsibleUser: {
      include: {
        role: true;
      };
    };
  };
}>;

type DateRangeFilter = {
  fromDate?: Date;
  toDate?: Date;
};

@Injectable()
export class StudentFollowUpsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createStudentFollowUpDto: CreateStudentFollowUpDto,
    authUser: AuthUser,
  ): Promise<StudentFollowUpResponseDto> {
    await this.ensureStudentExistsOrThrowBadRequest(createStudentFollowUpDto.studentId);
    this.ensureTeacherCanUseFollowUpType(authUser.role, createStudentFollowUpDto.type);

    const followUp = await this.prisma.studentFollowUp.create({
      data: {
        studentId: createStudentFollowUpDto.studentId,
        responsibleUserId: authUser.id,
        type: createStudentFollowUpDto.type,
        description: createStudentFollowUpDto.description,
        actionTaken: createStudentFollowUpDto.actionTaken,
        followUpDate: this.normalizeDate(createStudentFollowUpDto.followUpDate),
        nextReviewDate: createStudentFollowUpDto.nextReviewDate
          ? this.normalizeDate(createStudentFollowUpDto.nextReviewDate)
          : null,
      },
      include: {
        student: true,
        responsibleUser: {
          include: { role: true },
        },
      },
    });

    return this.toStudentFollowUpResponse(followUp);
  }

  async findAll(query: ListStudentFollowUpsQueryDto): Promise<StudentFollowUpResponseDto[]> {
    return this.findByFilters({}, query);
  }

  async findByStudent(
    studentId: string,
    query: ListStudentFollowUpsQueryDto,
  ): Promise<StudentFollowUpResponseDto[]> {
    await this.ensureStudentExistsOrThrowNotFound(studentId);

    return this.findByFilters({ studentId }, { ...query, studentId });
  }

  async update(
    id: string,
    updateStudentFollowUpDto: UpdateStudentFollowUpDto,
    authUser: AuthUser,
  ): Promise<StudentFollowUpResponseDto> {
    const existingFollowUp = await this.findFollowUpByIdOrThrow(id);
    const resolvedType = updateStudentFollowUpDto.type ?? existingFollowUp.type;

    if (
      updateStudentFollowUpDto.studentId &&
      updateStudentFollowUpDto.studentId !== existingFollowUp.studentId
    ) {
      await this.ensureStudentExistsOrThrowBadRequest(updateStudentFollowUpDto.studentId);
    }

    this.ensureTeacherCanUseFollowUpType(authUser.role, resolvedType);

    const updatedFollowUp = await this.prisma.studentFollowUp.update({
      where: { id },
      data: {
        ...(updateStudentFollowUpDto.studentId
          ? { studentId: updateStudentFollowUpDto.studentId }
          : {}),
        ...(updateStudentFollowUpDto.type ? { type: updateStudentFollowUpDto.type } : {}),
        ...(updateStudentFollowUpDto.description
          ? { description: updateStudentFollowUpDto.description }
          : {}),
        ...(updateStudentFollowUpDto.actionTaken !== undefined
          ? { actionTaken: updateStudentFollowUpDto.actionTaken }
          : {}),
        ...(updateStudentFollowUpDto.followUpDate
          ? { followUpDate: this.normalizeDate(updateStudentFollowUpDto.followUpDate) }
          : {}),
        ...(updateStudentFollowUpDto.nextReviewDate !== undefined
          ? {
              nextReviewDate: updateStudentFollowUpDto.nextReviewDate
                ? this.normalizeDate(updateStudentFollowUpDto.nextReviewDate)
                : null,
            }
          : {}),
      },
      include: {
        student: true,
        responsibleUser: {
          include: { role: true },
        },
      },
    });

    return this.toStudentFollowUpResponse(updatedFollowUp);
  }

  async remove(id: string): Promise<StudentFollowUpResponseDto> {
    const existingFollowUp = await this.findFollowUpByIdOrThrow(id);
    await this.prisma.studentFollowUp.delete({ where: { id } });
    return this.toStudentFollowUpResponse(existingFollowUp);
  }

  async getStudentSummary(studentId: string): Promise<StudentFollowUpsSummaryResponseDto> {
    await this.ensureStudentExistsOrThrowNotFound(studentId);

    const [totalSeguimientos, latestFollowUps, totalAcademico, totalConductual, totalFamiliar, totalEconomico, totalSocial, totalOtro] = await this.prisma.$transaction([
      this.prisma.studentFollowUp.count({
        where: { studentId },
      }),
      this.prisma.studentFollowUp.findMany({
        where: { studentId },
        include: {
          student: true,
          responsibleUser: {
            include: { role: true },
          },
        },
        orderBy: [{ followUpDate: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
      this.prisma.studentFollowUp.count({
        where: { studentId, type: FollowUpType.ACADEMICO },
      }),
      this.prisma.studentFollowUp.count({
        where: { studentId, type: FollowUpType.CONDUCTUAL },
      }),
      this.prisma.studentFollowUp.count({
        where: { studentId, type: FollowUpType.FAMILIAR },
      }),
      this.prisma.studentFollowUp.count({
        where: { studentId, type: FollowUpType.ECONOMICO },
      }),
      this.prisma.studentFollowUp.count({
        where: { studentId, type: FollowUpType.SOCIAL },
      }),
      this.prisma.studentFollowUp.count({
        where: { studentId, type: FollowUpType.OTRO },
      }),
    ]);

    return {
      studentId,
      totalSeguimientos,
      totalPorTipo: {
        ACADEMICO: totalAcademico,
        CONDUCTUAL: totalConductual,
        FAMILIAR: totalFamiliar,
        ECONOMICO: totalEconomico,
        SOCIAL: totalSocial,
        OTRO: totalOtro,
      },
      ultimosSeguimientos: latestFollowUps.map((followUp) =>
        this.toStudentFollowUpResponse(followUp),
      ),
    };
  }

  private async findByFilters(
    baseWhere: Prisma.StudentFollowUpWhereInput,
    query: ListStudentFollowUpsQueryDto,
  ): Promise<StudentFollowUpResponseDto[]> {
    const dateRange = this.resolveDateRange(query.dateFrom, query.dateTo);
    const where: Prisma.StudentFollowUpWhereInput = {
      ...baseWhere,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.responsibleUserId ? { responsibleUserId: query.responsibleUserId } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(this.getFollowUpDateWhereCondition(dateRange) ?? {}),
    };

    const followUps = await this.prisma.studentFollowUp.findMany({
      where,
      include: {
        student: true,
        responsibleUser: {
          include: { role: true },
        },
      },
      orderBy: [{ followUpDate: "desc" }, { createdAt: "desc" }],
    });

    return followUps.map((followUp) => this.toStudentFollowUpResponse(followUp));
  }

  private async ensureStudentExistsOrThrowBadRequest(studentId: string): Promise<Student> {
    const student = await this.findStudentById(studentId);

    if (!student) {
      throw new BadRequestException("El estudiante asociado no existe.");
    }

    return student;
  }

  private async ensureStudentExistsOrThrowNotFound(studentId: string): Promise<Student> {
    const student = await this.findStudentById(studentId);

    if (!student) {
      throw new NotFoundException("Estudiante no encontrado.");
    }

    return student;
  }

  private async findStudentById(studentId: string): Promise<Student | null> {
    return this.prisma.student.findUnique({
      where: { id: studentId },
    });
  }

  private async findFollowUpByIdOrThrow(id: string): Promise<StudentFollowUpWithRelations> {
    const followUp = await this.prisma.studentFollowUp.findUnique({
      where: { id },
      include: {
        student: true,
        responsibleUser: {
          include: { role: true },
        },
      },
    });

    if (!followUp) {
      throw new NotFoundException("Seguimiento no encontrado.");
    }

    return followUp;
  }

  private ensureTeacherCanUseFollowUpType(role: RoleName, type: FollowUpType): void {
    if (role !== RoleName.DOCENTE) {
      return;
    }

    if (type !== FollowUpType.ACADEMICO && type !== FollowUpType.CONDUCTUAL) {
      throw new ForbiddenException(
        "DOCENTE solo puede registrar seguimientos de tipo ACADEMICO o CONDUCTUAL.",
      );
    }
  }

  private resolveDateRange(dateFrom?: string, dateTo?: string): DateRangeFilter {
    const fromDate = dateFrom ? this.normalizeDate(dateFrom) : undefined;
    const toDate = dateTo ? this.normalizeDate(dateTo) : undefined;

    if (fromDate && toDate && fromDate.getTime() > toDate.getTime()) {
      throw new BadRequestException("dateFrom no puede ser mayor que dateTo.");
    }

    return { fromDate, toDate };
  }

  private getFollowUpDateWhereCondition(dateRange: DateRangeFilter):
    | { followUpDate: Prisma.DateTimeFilter }
    | null {
    if (!dateRange.fromDate && !dateRange.toDate) {
      return null;
    }

    return {
      followUpDate: {
        ...(dateRange.fromDate ? { gte: dateRange.fromDate } : {}),
        ...(dateRange.toDate ? { lte: dateRange.toDate } : {}),
      },
    };
  }

  private normalizeDate(dateInput: string | Date): Date {
    const parsedDate = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException("Fecha de seguimiento invalida.");
    }

    return new Date(
      Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
      ),
    );
  }

  private toStudentFollowUpResponse(
    followUp: StudentFollowUpWithRelations,
  ): StudentFollowUpResponseDto {
    return {
      id: followUp.id,
      studentId: followUp.studentId,
      responsibleUserId: followUp.responsibleUserId,
      type: followUp.type,
      description: followUp.description,
      actionTaken: followUp.actionTaken,
      followUpDate: followUp.followUpDate,
      nextReviewDate: followUp.nextReviewDate,
      student: {
        id: followUp.student.id,
        firstName: followUp.student.firstName,
        lastName: followUp.student.lastName,
        ci: followUp.student.ci,
      },
      responsibleUser: {
        id: followUp.responsibleUser.id,
        fullName: followUp.responsibleUser.fullName,
        email: followUp.responsibleUser.email,
        role: followUp.responsibleUser.role.name,
      },
      createdAt: followUp.createdAt,
      updatedAt: followUp.updatedAt,
    };
  }
}
