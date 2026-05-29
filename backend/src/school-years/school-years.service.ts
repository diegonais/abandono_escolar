import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, SchoolYear } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSchoolYearDto } from "./dto/create-school-year.dto";
import { ListSchoolYearsQueryDto } from "./dto/list-school-years-query.dto";
import {
  PaginatedSchoolYearsResponseDto,
  SchoolYearResponseDto,
} from "./dto/school-year-response.dto";
import { UpdateSchoolYearDto } from "./dto/update-school-year.dto";

@Injectable()
export class SchoolYearsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListSchoolYearsQueryDto): Promise<PaginatedSchoolYearsResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.SchoolYearWhereInput = {};

    if (typeof query.isActive === "boolean") {
      where.isActive = query.isActive;
    }

    const [total, schoolYears] = await this.prisma.$transaction([
      this.prisma.schoolYear.count({ where }),
      this.prisma.schoolYear.findMany({
        where,
        orderBy: { startDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: schoolYears.map((schoolYear) => this.toSchoolYearResponse(schoolYear)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<SchoolYearResponseDto> {
    const schoolYear = await this.findSchoolYearByIdOrThrow(id);
    return this.toSchoolYearResponse(schoolYear);
  }

  async create(createSchoolYearDto: CreateSchoolYearDto): Promise<SchoolYearResponseDto> {
    this.validateDateRange(createSchoolYearDto.startDate, createSchoolYearDto.endDate);
    await this.ensureSchoolYearNameIsAvailable(createSchoolYearDto.name);

    try {
      const schoolYear = await this.prisma.schoolYear.create({
        data: {
          name: createSchoolYearDto.name,
          startDate: new Date(createSchoolYearDto.startDate),
          endDate: new Date(createSchoolYearDto.endDate),
          isActive: createSchoolYearDto.isActive ?? true,
        },
      });

      return this.toSchoolYearResponse(schoolYear);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException("Ya existe una gestion escolar con ese nombre.");
      }

      throw error;
    }
  }

  async update(id: string, updateSchoolYearDto: UpdateSchoolYearDto): Promise<SchoolYearResponseDto> {
    const existingSchoolYear = await this.findSchoolYearByIdOrThrow(id);

    if (updateSchoolYearDto.name && updateSchoolYearDto.name !== existingSchoolYear.name) {
      await this.ensureSchoolYearNameIsAvailable(updateSchoolYearDto.name, id);
    }

    const resolvedStartDate = updateSchoolYearDto.startDate ?? existingSchoolYear.startDate.toISOString();
    const resolvedEndDate = updateSchoolYearDto.endDate ?? existingSchoolYear.endDate.toISOString();
    this.validateDateRange(resolvedStartDate, resolvedEndDate);

    try {
      const updatedSchoolYear = await this.prisma.schoolYear.update({
        where: { id },
        data: {
          ...(updateSchoolYearDto.name ? { name: updateSchoolYearDto.name } : {}),
          ...(updateSchoolYearDto.startDate
            ? { startDate: new Date(updateSchoolYearDto.startDate) }
            : {}),
          ...(updateSchoolYearDto.endDate
            ? { endDate: new Date(updateSchoolYearDto.endDate) }
            : {}),
          ...(typeof updateSchoolYearDto.isActive === "boolean"
            ? { isActive: updateSchoolYearDto.isActive }
            : {}),
        },
      });

      return this.toSchoolYearResponse(updatedSchoolYear);
    } catch (error) {
      if (this.isPrismaUniqueConstraintError(error)) {
        throw new ConflictException("Ya existe una gestion escolar con ese nombre.");
      }

      throw error;
    }
  }

  async deactivate(id: string): Promise<SchoolYearResponseDto> {
    const existingSchoolYear = await this.findSchoolYearByIdOrThrow(id);

    if (!existingSchoolYear.isActive) {
      return this.toSchoolYearResponse(existingSchoolYear);
    }

    const deactivatedSchoolYear = await this.prisma.schoolYear.update({
      where: { id },
      data: { isActive: false },
    });

    return this.toSchoolYearResponse(deactivatedSchoolYear);
  }

  private async findSchoolYearByIdOrThrow(id: string): Promise<SchoolYear> {
    const schoolYear = await this.prisma.schoolYear.findUnique({
      where: { id },
    });

    if (!schoolYear) {
      throw new NotFoundException("Gestion escolar no encontrada.");
    }

    return schoolYear;
  }

  private async ensureSchoolYearNameIsAvailable(
    name: string,
    excludeSchoolYearId?: string,
  ): Promise<void> {
    const existingSchoolYear = await this.prisma.schoolYear.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
      select: { id: true },
    });

    if (existingSchoolYear && existingSchoolYear.id !== excludeSchoolYearId) {
      throw new ConflictException("Ya existe una gestion escolar con ese nombre.");
    }
  }

  private validateDateRange(startDate: string, endDate: string): void {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start.getTime() > end.getTime()) {
      throw new BadRequestException(
        "La fecha de inicio no puede ser mayor a la fecha de fin.",
      );
    }
  }

  private isPrismaUniqueConstraintError(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
    );
  }

  private toSchoolYearResponse(schoolYear: SchoolYear): SchoolYearResponseDto {
    return {
      id: schoolYear.id,
      name: schoolYear.name,
      startDate: schoolYear.startDate,
      endDate: schoolYear.endDate,
      isActive: schoolYear.isActive,
      createdAt: schoolYear.createdAt,
      updatedAt: schoolYear.updatedAt,
    };
  }
}
