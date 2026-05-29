import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AttendanceStatus, Course, Prisma, Student } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  AttendanceResponseDto,
  AttendanceSummaryResponseDto,
} from "./dto/attendance-response.dto";
import { AttendanceSummaryQueryDto } from "./dto/attendance-summary-query.dto";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { ListAttendanceQueryDto } from "./dto/list-attendance-query.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";

type AttendanceWithRelations = Prisma.AttendanceGetPayload<{
  include: {
    student: true;
    course: true;
  };
}>;

type DateRangeFilter = {
  fromDate?: Date;
  toDate?: Date;
};

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAttendanceDto: CreateAttendanceDto): Promise<AttendanceResponseDto> {
    const student = await this.findStudentById(createAttendanceDto.studentId);
    const course = await this.findCourseById(createAttendanceDto.courseId);

    if (!student) {
      throw new BadRequestException("El estudiante asociado no existe.");
    }

    if (!course) {
      throw new BadRequestException("El curso asociado no existe.");
    }

    const normalizedDate = this.normalizeDate(createAttendanceDto.date);
    this.ensureDateIsNotFuture(normalizedDate);

    await this.ensureAttendanceIsAvailable(
      createAttendanceDto.studentId,
      createAttendanceDto.courseId,
      normalizedDate,
    );

    try {
      const attendance = await this.prisma.attendance.create({
        data: {
          studentId: createAttendanceDto.studentId,
          courseId: createAttendanceDto.courseId,
          date: normalizedDate,
          status: createAttendanceDto.status,
          observation: createAttendanceDto.observation,
        },
        include: {
          student: true,
          course: true,
        },
      });

      return this.toAttendanceResponse(attendance);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          "Ya existe asistencia para ese estudiante, curso y fecha.",
        );
      }

      throw error;
    }
  }

  async createBulk(
    createAttendanceDtos: CreateAttendanceDto[],
  ): Promise<AttendanceResponseDto[]> {
    const normalizedRecords = createAttendanceDtos.map((record) => {
      const normalizedDate = this.normalizeDate(record.date);
      this.ensureDateIsNotFuture(normalizedDate);

      return {
        ...record,
        normalizedDate,
      };
    });

    await this.ensureReferencedEntitiesExist(normalizedRecords);
    this.ensureNoDuplicatedRecordsInPayload(normalizedRecords);
    await this.ensureNoExistingDuplicatedRecords(normalizedRecords);

    try {
      const createdAttendances = await this.prisma.$transaction(
        normalizedRecords.map((record) =>
          this.prisma.attendance.create({
            data: {
              studentId: record.studentId,
              courseId: record.courseId,
              date: record.normalizedDate,
              status: record.status,
              observation: record.observation,
            },
            include: {
              student: true,
              course: true,
            },
          }),
        ),
      );

      return createdAttendances.map((attendance) => this.toAttendanceResponse(attendance));
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          "Una o mas asistencias ya existen para la combinacion estudiante-curso-fecha.",
        );
      }

      throw error;
    }
  }

  async findAll(query: ListAttendanceQueryDto): Promise<AttendanceResponseDto[]> {
    return this.findByFilters({}, query);
  }

  async findByStudent(
    studentId: string,
    query: ListAttendanceQueryDto,
  ): Promise<AttendanceResponseDto[]> {
    await this.ensureStudentExistsOrThrowNotFound(studentId);
    return this.findByFilters({ studentId }, query);
  }

  async findByCourse(
    courseId: string,
    query: ListAttendanceQueryDto,
  ): Promise<AttendanceResponseDto[]> {
    await this.ensureCourseExistsOrThrowNotFound(courseId);
    return this.findByFilters({ courseId }, query);
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto): Promise<AttendanceResponseDto> {
    const existingAttendance = await this.findAttendanceByIdOrThrow(id);

    const resolvedStudentId = updateAttendanceDto.studentId ?? existingAttendance.studentId;
    const resolvedCourseId = updateAttendanceDto.courseId ?? existingAttendance.courseId;
    const resolvedDate = updateAttendanceDto.date
      ? this.normalizeDate(updateAttendanceDto.date)
      : this.normalizeDate(existingAttendance.date);

    this.ensureDateIsNotFuture(resolvedDate);

    if (updateAttendanceDto.studentId && updateAttendanceDto.studentId !== existingAttendance.studentId) {
      const student = await this.findStudentById(updateAttendanceDto.studentId);

      if (!student) {
        throw new BadRequestException("El estudiante asociado no existe.");
      }
    }

    if (updateAttendanceDto.courseId && updateAttendanceDto.courseId !== existingAttendance.courseId) {
      const course = await this.findCourseById(updateAttendanceDto.courseId);

      if (!course) {
        throw new BadRequestException("El curso asociado no existe.");
      }
    }

    await this.ensureAttendanceIsAvailable(
      resolvedStudentId,
      resolvedCourseId,
      resolvedDate,
      id,
    );

    try {
      const updatedAttendance = await this.prisma.attendance.update({
        where: { id },
        data: {
          ...(updateAttendanceDto.studentId ? { studentId: updateAttendanceDto.studentId } : {}),
          ...(updateAttendanceDto.courseId ? { courseId: updateAttendanceDto.courseId } : {}),
          ...(updateAttendanceDto.date ? { date: resolvedDate } : {}),
          ...(updateAttendanceDto.status ? { status: updateAttendanceDto.status } : {}),
          ...(updateAttendanceDto.observation !== undefined
            ? { observation: updateAttendanceDto.observation }
            : {}),
        },
        include: {
          student: true,
          course: true,
        },
      });

      return this.toAttendanceResponse(updatedAttendance);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          "Ya existe asistencia para ese estudiante, curso y fecha.",
        );
      }

      throw error;
    }
  }

  async getStudentSummary(
    studentId: string,
    query: AttendanceSummaryQueryDto,
  ): Promise<AttendanceSummaryResponseDto> {
    await this.ensureStudentExistsOrThrowNotFound(studentId);

    const dateRange = this.resolveDateRange(query.dateFrom, query.dateTo);
    const where: Prisma.AttendanceWhereInput = {
      studentId,
      ...(this.getDateWhereCondition(dateRange) ?? {}),
    };

    const [totalPresentes, totalFaltas, totalAtrasos, totalJustificados, aggregatedRange] =
      await this.prisma.$transaction([
        this.prisma.attendance.count({
          where: { ...where, status: AttendanceStatus.PRESENTE },
        }),
        this.prisma.attendance.count({
          where: { ...where, status: AttendanceStatus.FALTA },
        }),
        this.prisma.attendance.count({
          where: { ...where, status: AttendanceStatus.ATRASO },
        }),
        this.prisma.attendance.count({
          where: { ...where, status: AttendanceStatus.JUSTIFICADO },
        }),
        this.prisma.attendance.aggregate({
          where,
          _min: { date: true },
          _max: { date: true },
        }),
      ]);

    const rangeFrom = dateRange.fromDate ?? aggregatedRange._min.date ?? null;
    const rangeTo = dateRange.toDate ?? aggregatedRange._max.date ?? null;

    return {
      studentId,
      totalPresentes,
      totalFaltas,
      totalAtrasos,
      totalJustificados,
      rangoUsado: {
        dateFrom: this.toDateOnlyString(rangeFrom),
        dateTo: this.toDateOnlyString(rangeTo),
      },
    };
  }

  private async findByFilters(
    baseWhere: Prisma.AttendanceWhereInput,
    query: ListAttendanceQueryDto,
  ): Promise<AttendanceResponseDto[]> {
    const dateRange = this.resolveDateRange(query.dateFrom, query.dateTo);
    const where: Prisma.AttendanceWhereInput = {
      ...baseWhere,
      ...(query.status ? { status: query.status } : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(this.getDateWhereCondition(dateRange) ?? {}),
    };

    const attendances = await this.prisma.attendance.findMany({
      where,
      include: {
        student: true,
        course: true,
      },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });

    return attendances.map((attendance) => this.toAttendanceResponse(attendance));
  }

  private async ensureReferencedEntitiesExist(
    records: Array<CreateAttendanceDto & { normalizedDate: Date }>,
  ): Promise<void> {
    const uniqueStudentIds = Array.from(new Set(records.map((record) => record.studentId)));
    const uniqueCourseIds = Array.from(new Set(records.map((record) => record.courseId)));

    const [existingStudents, existingCourses] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where: { id: { in: uniqueStudentIds } },
        select: { id: true },
      }),
      this.prisma.course.findMany({
        where: { id: { in: uniqueCourseIds } },
        select: { id: true },
      }),
    ]);

    if (existingStudents.length !== uniqueStudentIds.length) {
      throw new BadRequestException("Uno o mas estudiantes no existen.");
    }

    if (existingCourses.length !== uniqueCourseIds.length) {
      throw new BadRequestException("Uno o mas cursos no existen.");
    }
  }

  private ensureNoDuplicatedRecordsInPayload(
    records: Array<CreateAttendanceDto & { normalizedDate: Date }>,
  ): void {
    const keys = new Set<string>();

    for (const record of records) {
      const key = this.getAttendanceKey(
        record.studentId,
        record.courseId,
        record.normalizedDate,
      );

      if (keys.has(key)) {
        throw new ConflictException(
          "El lote contiene registros duplicados para estudiante, curso y fecha.",
        );
      }

      keys.add(key);
    }
  }

  private async ensureNoExistingDuplicatedRecords(
    records: Array<CreateAttendanceDto & { normalizedDate: Date }>,
  ): Promise<void> {
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        OR: records.map((record) => ({
          studentId: record.studentId,
          courseId: record.courseId,
          date: record.normalizedDate,
        })),
      },
      select: { id: true },
    });

    if (existingAttendance) {
      throw new ConflictException(
        "Una o mas asistencias ya existen para la combinacion estudiante-curso-fecha.",
      );
    }
  }

  private async ensureAttendanceIsAvailable(
    studentId: string,
    courseId: string,
    date: Date,
    excludeAttendanceId?: string,
  ): Promise<void> {
    const existingAttendance = await this.prisma.attendance.findFirst({
      where: {
        studentId,
        courseId,
        date,
      },
      select: { id: true },
    });

    if (existingAttendance && existingAttendance.id !== excludeAttendanceId) {
      throw new ConflictException(
        "Ya existe asistencia para ese estudiante, curso y fecha.",
      );
    }
  }

  private async findAttendanceByIdOrThrow(id: string): Promise<AttendanceWithRelations> {
    const attendance = await this.prisma.attendance.findUnique({
      where: { id },
      include: {
        student: true,
        course: true,
      },
    });

    if (!attendance) {
      throw new NotFoundException("Asistencia no encontrada.");
    }

    return attendance;
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

  private async ensureStudentExistsOrThrowNotFound(id: string): Promise<void> {
    const student = await this.findStudentById(id);

    if (!student) {
      throw new NotFoundException("Estudiante no encontrado.");
    }
  }

  private async ensureCourseExistsOrThrowNotFound(id: string): Promise<void> {
    const course = await this.findCourseById(id);

    if (!course) {
      throw new NotFoundException("Curso no encontrado.");
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

  private getDateWhereCondition(dateRange: DateRangeFilter):
    | { date: Prisma.DateTimeFilter }
    | null {
    if (!dateRange.fromDate && !dateRange.toDate) {
      return null;
    }

    return {
      date: {
        ...(dateRange.fromDate ? { gte: dateRange.fromDate } : {}),
        ...(dateRange.toDate ? { lte: dateRange.toDate } : {}),
      },
    };
  }

  private normalizeDate(dateInput: string | Date): Date {
    const parsedDate = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new BadRequestException("Fecha de asistencia invalida.");
    }

    return new Date(
      Date.UTC(
        parsedDate.getUTCFullYear(),
        parsedDate.getUTCMonth(),
        parsedDate.getUTCDate(),
      ),
    );
  }

  private ensureDateIsNotFuture(date: Date): void {
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );

    if (date.getTime() > today.getTime()) {
      throw new BadRequestException("No se permite registrar asistencias en fechas futuras.");
    }
  }

  private isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  private getAttendanceKey(studentId: string, courseId: string, date: Date): string {
    return `${studentId}-${courseId}-${date.toISOString()}`;
  }

  private toDateOnlyString(date: Date | null): string | null {
    if (!date) {
      return null;
    }

    return date.toISOString().slice(0, 10);
  }

  private toAttendanceResponse(attendance: AttendanceWithRelations): AttendanceResponseDto {
    return {
      id: attendance.id,
      studentId: attendance.studentId,
      courseId: attendance.courseId,
      date: attendance.date,
      status: attendance.status,
      observation: attendance.observation,
      student: {
        id: attendance.student.id,
        firstName: attendance.student.firstName,
        lastName: attendance.student.lastName,
        ci: attendance.student.ci,
      },
      course: {
        id: attendance.course.id,
        level: attendance.course.level,
        parallel: attendance.course.parallel,
        schoolYearId: attendance.course.schoolYearId,
      },
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
    };
  }
}
