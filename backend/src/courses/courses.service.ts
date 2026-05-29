import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, SchoolYear } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { CourseResponseDto, PaginatedCoursesResponseDto } from "./dto/course-response.dto";
import { ListCoursesQueryDto } from "./dto/list-courses-query.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

type CourseWithSchoolYear = Prisma.CourseGetPayload<{
  include: { schoolYear: true };
}>;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListCoursesQueryDto): Promise<PaginatedCoursesResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.CourseWhereInput = {};

    if (query.schoolYearId) {
      where.schoolYearId = query.schoolYearId;
    }

    const [total, courses] = await this.prisma.$transaction([
      this.prisma.course.count({ where }),
      this.prisma.course.findMany({
        where,
        include: { schoolYear: true },
        orderBy: [{ level: "asc" }, { parallel: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: courses.map((course) => this.toCourseResponse(course)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<CourseResponseDto> {
    const course = await this.findCourseByIdOrThrow(id);
    return this.toCourseResponse(course);
  }

  async create(createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    await this.findSchoolYearByIdOrThrow(createCourseDto.schoolYearId);
    await this.ensureCourseCombinationIsAvailable(
      createCourseDto.level,
      createCourseDto.parallel,
      createCourseDto.schoolYearId,
    );

    try {
      const course = await this.prisma.course.create({
        data: {
          level: createCourseDto.level,
          parallel: createCourseDto.parallel,
          schoolYearId: createCourseDto.schoolYearId,
        },
        include: { schoolYear: true },
      });

      return this.toCourseResponse(course);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          "Ya existe un curso con ese nivel, paralelo y gestion escolar.",
        );
      }

      throw error;
    }
  }

  async update(id: string, updateCourseDto: UpdateCourseDto): Promise<CourseResponseDto> {
    const existingCourse = await this.findCourseByIdOrThrow(id);

    if (
      updateCourseDto.schoolYearId &&
      updateCourseDto.schoolYearId !== existingCourse.schoolYearId
    ) {
      await this.findSchoolYearByIdOrThrow(updateCourseDto.schoolYearId);
    }

    const resolvedLevel = updateCourseDto.level ?? existingCourse.level;
    const resolvedParallel = updateCourseDto.parallel ?? existingCourse.parallel;
    const resolvedSchoolYearId = updateCourseDto.schoolYearId ?? existingCourse.schoolYearId;

    await this.ensureCourseCombinationIsAvailable(
      resolvedLevel,
      resolvedParallel,
      resolvedSchoolYearId,
      id,
    );

    try {
      const updatedCourse = await this.prisma.course.update({
        where: { id },
        data: {
          ...(updateCourseDto.level ? { level: updateCourseDto.level } : {}),
          ...(updateCourseDto.parallel ? { parallel: updateCourseDto.parallel } : {}),
          ...(updateCourseDto.schoolYearId
            ? { schoolYear: { connect: { id: updateCourseDto.schoolYearId } } }
            : {}),
        },
        include: { schoolYear: true },
      });

      return this.toCourseResponse(updatedCourse);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException(
          "Ya existe un curso con ese nivel, paralelo y gestion escolar.",
        );
      }

      throw error;
    }
  }

  async remove(id: string): Promise<CourseResponseDto> {
    const existingCourse = await this.findCourseByIdOrThrow(id);

    try {
      await this.prisma.course.delete({
        where: { id },
      });

      return this.toCourseResponse(existingCourse);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new ConflictException(
          "No se puede eliminar el curso porque tiene registros relacionados.",
        );
      }

      throw error;
    }
  }

  private async findCourseByIdOrThrow(id: string): Promise<CourseWithSchoolYear> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { schoolYear: true },
    });

    if (!course) {
      throw new NotFoundException("Curso no encontrado.");
    }

    return course;
  }

  private async findSchoolYearByIdOrThrow(id: string): Promise<SchoolYear> {
    const schoolYear = await this.prisma.schoolYear.findUnique({
      where: { id },
    });

    if (!schoolYear) {
      throw new BadRequestException("La gestion escolar asociada no existe.");
    }

    return schoolYear;
  }

  private async ensureCourseCombinationIsAvailable(
    level: string,
    parallel: string,
    schoolYearId: string,
    excludeCourseId?: string,
  ): Promise<void> {
    const existingCourse = await this.prisma.course.findFirst({
      where: {
        level,
        parallel,
        schoolYearId,
      },
      select: { id: true },
    });

    if (existingCourse && existingCourse.id !== excludeCourseId) {
      throw new ConflictException(
        "Ya existe un curso con ese nivel, paralelo y gestion escolar.",
      );
    }
  }

  private isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  private toCourseResponse(course: CourseWithSchoolYear): CourseResponseDto {
    return {
      id: course.id,
      level: course.level,
      parallel: course.parallel,
      schoolYearId: course.schoolYearId,
      schoolYear: {
        id: course.schoolYear.id,
        name: course.schoolYear.name,
      },
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }
}
