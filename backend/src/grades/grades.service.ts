import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {
  AcademicPeriod,
  Course,
  Grade,
  Prisma,
  Student,
  Subject,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGradeDto } from "./dto/create-grade.dto";
import {
  GradeResponseDto,
  GradeStudentSummaryResponseDto,
} from "./dto/grade-response.dto";
import { ListGradesQueryDto } from "./dto/list-grades-query.dto";
import { UpdateGradeDto } from "./dto/update-grade.dto";

type GradeWithRelations = Prisma.GradeGetPayload<{
  include: {
    student: true;
    subject: true;
    course: true;
  };
}>;

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createGradeDto: CreateGradeDto): Promise<GradeResponseDto> {
    await this.ensureReferencedEntitiesForSingleGrade(
      createGradeDto.studentId,
      createGradeDto.subjectId,
      createGradeDto.courseId,
    );

    await this.ensureGradeIsAvailable(
      createGradeDto.studentId,
      createGradeDto.subjectId,
      createGradeDto.courseId,
      createGradeDto.period,
    );

    try {
      const createdGrade = await this.prisma.grade.create({
        data: createGradeDto,
        include: {
          student: true,
          subject: true,
          course: true,
        },
      });

      return this.toGradeResponse(createdGrade);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          "Ya existe una calificacion para studentId + subjectId + courseId + period.",
        );
      }

      throw error;
    }
  }

  async createBulk(createGradeDtos: CreateGradeDto[]): Promise<GradeResponseDto[]> {
    await this.ensureReferencedEntitiesForBulk(createGradeDtos);
    this.ensureNoDuplicatedRecordsInPayload(createGradeDtos);
    await this.ensureNoExistingDuplicatedRecords(createGradeDtos);

    try {
      const createdGrades = await this.prisma.$transaction(
        createGradeDtos.map((record) =>
          this.prisma.grade.create({
            data: record,
            include: {
              student: true,
              subject: true,
              course: true,
            },
          }),
        ),
      );

      return createdGrades.map((grade) => this.toGradeResponse(grade));
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          "Una o mas calificaciones ya existen para studentId + subjectId + courseId + period.",
        );
      }

      throw error;
    }
  }

  async findAll(query: ListGradesQueryDto): Promise<GradeResponseDto[]> {
    return this.findByFilters({}, query);
  }

  async findByStudent(studentId: string, query: ListGradesQueryDto): Promise<GradeResponseDto[]> {
    await this.ensureStudentExistsOrThrowNotFound(studentId);
    return this.findByFilters({ studentId }, { ...query, studentId });
  }

  async findByCourse(courseId: string, query: ListGradesQueryDto): Promise<GradeResponseDto[]> {
    await this.ensureCourseExistsOrThrowNotFound(courseId);
    return this.findByFilters({ courseId }, { ...query, courseId });
  }

  async update(id: string, updateGradeDto: UpdateGradeDto): Promise<GradeResponseDto> {
    const existingGrade = await this.findGradeByIdOrThrow(id);

    const resolvedStudentId = updateGradeDto.studentId ?? existingGrade.studentId;
    const resolvedSubjectId = updateGradeDto.subjectId ?? existingGrade.subjectId;
    const resolvedCourseId = updateGradeDto.courseId ?? existingGrade.courseId;
    const resolvedPeriod = updateGradeDto.period ?? existingGrade.period;

    if (updateGradeDto.studentId && updateGradeDto.studentId !== existingGrade.studentId) {
      const student = await this.findStudentById(updateGradeDto.studentId);
      if (!student) {
        throw new BadRequestException("El estudiante asociado no existe.");
      }
    }

    if (updateGradeDto.subjectId && updateGradeDto.subjectId !== existingGrade.subjectId) {
      const subject = await this.findSubjectById(updateGradeDto.subjectId);
      if (!subject) {
        throw new BadRequestException("La materia asociada no existe.");
      }
    }

    if (updateGradeDto.courseId && updateGradeDto.courseId !== existingGrade.courseId) {
      const course = await this.findCourseById(updateGradeDto.courseId);
      if (!course) {
        throw new BadRequestException("El curso asociado no existe.");
      }
    }

    await this.ensureGradeIsAvailable(
      resolvedStudentId,
      resolvedSubjectId,
      resolvedCourseId,
      resolvedPeriod,
      id,
    );

    try {
      const updatedGrade = await this.prisma.grade.update({
        where: { id },
        data: {
          ...(updateGradeDto.studentId ? { studentId: updateGradeDto.studentId } : {}),
          ...(updateGradeDto.subjectId ? { subjectId: updateGradeDto.subjectId } : {}),
          ...(updateGradeDto.courseId ? { courseId: updateGradeDto.courseId } : {}),
          ...(updateGradeDto.period ? { period: updateGradeDto.period } : {}),
          ...(updateGradeDto.score !== undefined ? { score: updateGradeDto.score } : {}),
        },
        include: {
          student: true,
          subject: true,
          course: true,
        },
      });

      return this.toGradeResponse(updatedGrade);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          "Ya existe una calificacion para studentId + subjectId + courseId + period.",
        );
      }

      throw error;
    }
  }

  async getStudentSummary(studentId: string): Promise<GradeStudentSummaryResponseDto> {
    await this.ensureStudentExistsOrThrowNotFound(studentId);

    const grades = await this.prisma.grade.findMany({
      where: { studentId },
      include: {
        subject: true,
      },
      orderBy: [{ subject: { name: "asc" } }, { createdAt: "asc" }],
    });

    const totalScores = grades.reduce((acc, grade) => acc + this.decimalToNumber(grade.score), 0);
    const promedioGeneral = this.roundTo2(grades.length === 0 ? 0 : totalScores / grades.length);

    const bySubject = this.groupGradesBySubject(grades);
    const notasPorMateria = Array.from(bySubject.values()).map((subjectGroup) => {
      const subjectTotal = subjectGroup.grades.reduce(
        (acc, grade) => acc + this.decimalToNumber(grade.score),
        0,
      );
      const promedioMateria = this.roundTo2(subjectTotal / subjectGroup.grades.length);

      return {
        subjectId: subjectGroup.subjectId,
        subjectName: subjectGroup.subjectName,
        promedioMateria,
        estaReprobada: promedioMateria < 51,
        periodos: subjectGroup.grades.map((grade) => ({
          period: grade.period,
          score: this.decimalToNumber(grade.score),
        })),
      };
    });

    const materiasReprobadas = notasPorMateria.filter((item) => item.estaReprobada).length;

    return {
      studentId,
      promedioGeneral,
      materiasReprobadas,
      notasPorMateria,
      indicadorBajoRendimiento: promedioGeneral < 51 || materiasReprobadas > 0,
    };
  }

  private async findByFilters(
    baseWhere: Prisma.GradeWhereInput,
    query: ListGradesQueryDto,
  ): Promise<GradeResponseDto[]> {
    const where: Prisma.GradeWhereInput = {
      ...baseWhere,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.courseId ? { courseId: query.courseId } : {}),
      ...(query.period ? { period: query.period } : {}),
    };

    const grades = await this.prisma.grade.findMany({
      where,
      include: {
        student: true,
        subject: true,
        course: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return grades.map((grade) => this.toGradeResponse(grade));
  }

  private groupGradesBySubject(
    grades: Array<
      Grade & {
        subject: Subject;
      }
    >,
  ): Map<
    string,
    {
      subjectId: string;
      subjectName: string;
      grades: Grade[];
    }
  > {
    const result = new Map<
      string,
      {
        subjectId: string;
        subjectName: string;
        grades: Grade[];
      }
    >();

    for (const grade of grades) {
      const existingGroup = result.get(grade.subjectId);

      if (existingGroup) {
        existingGroup.grades.push(grade);
        continue;
      }

      result.set(grade.subjectId, {
        subjectId: grade.subjectId,
        subjectName: grade.subject.name,
        grades: [grade],
      });
    }

    return result;
  }

  private async ensureReferencedEntitiesForSingleGrade(
    studentId: string,
    subjectId: string,
    courseId: string,
  ): Promise<void> {
    const [student, subject, course] = await Promise.all([
      this.findStudentById(studentId),
      this.findSubjectById(subjectId),
      this.findCourseById(courseId),
    ]);

    if (!student) {
      throw new BadRequestException("El estudiante asociado no existe.");
    }

    if (!subject) {
      throw new BadRequestException("La materia asociada no existe.");
    }

    if (!course) {
      throw new BadRequestException("El curso asociado no existe.");
    }
  }

  private async ensureReferencedEntitiesForBulk(records: CreateGradeDto[]): Promise<void> {
    const uniqueStudentIds = Array.from(new Set(records.map((record) => record.studentId)));
    const uniqueSubjectIds = Array.from(new Set(records.map((record) => record.subjectId)));
    const uniqueCourseIds = Array.from(new Set(records.map((record) => record.courseId)));

    const [existingStudents, existingSubjects, existingCourses] = await this.prisma.$transaction([
      this.prisma.student.findMany({
        where: { id: { in: uniqueStudentIds } },
        select: { id: true },
      }),
      this.prisma.subject.findMany({
        where: { id: { in: uniqueSubjectIds } },
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

    if (existingSubjects.length !== uniqueSubjectIds.length) {
      throw new BadRequestException("Una o mas materias no existen.");
    }

    if (existingCourses.length !== uniqueCourseIds.length) {
      throw new BadRequestException("Uno o mas cursos no existen.");
    }
  }

  private ensureNoDuplicatedRecordsInPayload(records: CreateGradeDto[]): void {
    const keys = new Set<string>();

    for (const record of records) {
      const key = this.getGradeKey(
        record.studentId,
        record.subjectId,
        record.courseId,
        record.period,
      );

      if (keys.has(key)) {
        throw new ConflictException(
          "El lote contiene registros duplicados para studentId + subjectId + courseId + period.",
        );
      }

      keys.add(key);
    }
  }

  private async ensureNoExistingDuplicatedRecords(records: CreateGradeDto[]): Promise<void> {
    const existingGrade = await this.prisma.grade.findFirst({
      where: {
        OR: records.map((record) => ({
          studentId: record.studentId,
          subjectId: record.subjectId,
          courseId: record.courseId,
          period: record.period,
        })),
      },
      select: { id: true },
    });

    if (existingGrade) {
      throw new ConflictException(
        "Una o mas calificaciones ya existen para studentId + subjectId + courseId + period.",
      );
    }
  }

  private async ensureGradeIsAvailable(
    studentId: string,
    subjectId: string,
    courseId: string,
    period: AcademicPeriod,
    excludeGradeId?: string,
  ): Promise<void> {
    const existingGrade = await this.prisma.grade.findFirst({
      where: {
        studentId,
        subjectId,
        courseId,
        period,
      },
      select: { id: true },
    });

    if (existingGrade && existingGrade.id !== excludeGradeId) {
      throw new ConflictException(
        "Ya existe una calificacion para studentId + subjectId + courseId + period.",
      );
    }
  }

  private async findGradeByIdOrThrow(id: string): Promise<GradeWithRelations> {
    const grade = await this.prisma.grade.findUnique({
      where: { id },
      include: {
        student: true,
        subject: true,
        course: true,
      },
    });

    if (!grade) {
      throw new NotFoundException("Calificacion no encontrada.");
    }

    return grade;
  }

  private async findStudentById(id: string): Promise<Student | null> {
    return this.prisma.student.findUnique({ where: { id } });
  }

  private async findSubjectById(id: string): Promise<Subject | null> {
    return this.prisma.subject.findUnique({ where: { id } });
  }

  private async findCourseById(id: string): Promise<Course | null> {
    return this.prisma.course.findUnique({ where: { id } });
  }

  private async ensureStudentExistsOrThrowNotFound(studentId: string): Promise<void> {
    const student = await this.findStudentById(studentId);
    if (!student) {
      throw new NotFoundException("Estudiante no encontrado.");
    }
  }

  private async ensureCourseExistsOrThrowNotFound(courseId: string): Promise<void> {
    const course = await this.findCourseById(courseId);
    if (!course) {
      throw new NotFoundException("Curso no encontrado.");
    }
  }

  private getGradeKey(
    studentId: string,
    subjectId: string,
    courseId: string,
    period: AcademicPeriod,
  ): string {
    return `${studentId}-${subjectId}-${courseId}-${period}`;
  }

  private roundTo2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private decimalToNumber(value: Prisma.Decimal): number {
    return Number(value);
  }

  private isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  private toGradeResponse(grade: GradeWithRelations): GradeResponseDto {
    return {
      id: grade.id,
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      courseId: grade.courseId,
      period: grade.period,
      score: this.decimalToNumber(grade.score),
      student: {
        id: grade.student.id,
        firstName: grade.student.firstName,
        lastName: grade.student.lastName,
        ci: grade.student.ci,
      },
      subject: {
        id: grade.subject.id,
        name: grade.subject.name,
        code: grade.subject.code,
      },
      course: {
        id: grade.course.id,
        level: grade.course.level,
        parallel: grade.course.parallel,
        schoolYearId: grade.course.schoolYearId,
      },
      createdAt: grade.createdAt,
      updatedAt: grade.updatedAt,
    };
  }
}
