import { ApiPropertyOptional } from "@nestjs/swagger";
import { AttendanceStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";

export class ListAttendanceQueryDto {
  @ApiPropertyOptional({
    example: "2026-05-01",
    description: "Filtrar desde esta fecha (inclusive)",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: "2026-05-31",
    description: "Filtrar hasta esta fecha (inclusive)",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({
    example: "08ed9fdd-1d5a-4fd9-b17f-bbc38345ea5f",
    description: "Filtrar por ID de curso",
    format: "uuid",
  })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({
    example: "a8ad2ea8-69c8-4b95-aa81-c0a775acbb77",
    description: "Filtrar por ID de estudiante",
    format: "uuid",
  })
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({
    enum: AttendanceStatus,
    description: "Filtrar por estado de asistencia",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase().trim() : value))
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;
}
