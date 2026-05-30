import { ApiPropertyOptional } from "@nestjs/swagger";
import { AcademicPeriod } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export class ListGradesQueryDto {
  @ApiPropertyOptional({
    example: "a8ad2ea8-69c8-4b95-aa81-c0a775acbb77",
    description: "Filtrar por ID de estudiante",
    format: "uuid",
  })
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({
    example: "9858f3c0-f4ec-4bd9-bcd9-b2df56056df2",
    description: "Filtrar por ID de materia",
    format: "uuid",
  })
  @IsUUID()
  @IsOptional()
  subjectId?: string;

  @ApiPropertyOptional({
    example: "08ed9fdd-1d5a-4fd9-b17f-bbc38345ea5f",
    description: "Filtrar por ID de curso",
    format: "uuid",
  })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({
    enum: AcademicPeriod,
    description: "Filtrar por periodo academico",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase().trim() : value))
  @IsEnum(AcademicPeriod)
  @IsOptional()
  period?: AcademicPeriod;
}
