import { ApiPropertyOptional } from "@nestjs/swagger";
import { AttendanceStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

function toOptionalObservation(value: unknown): unknown {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export class UpdateAttendanceDto {
  @ApiPropertyOptional({
    example: "a8ad2ea8-69c8-4b95-aa81-c0a775acbb77",
    description: "ID del estudiante",
    format: "uuid",
  })
  @IsUUID()
  @IsOptional()
  studentId?: string;

  @ApiPropertyOptional({
    example: "08ed9fdd-1d5a-4fd9-b17f-bbc38345ea5f",
    description: "ID del curso",
    format: "uuid",
  })
  @IsUUID()
  @IsOptional()
  courseId?: string;

  @ApiPropertyOptional({
    example: "2026-05-20",
    description: "Fecha de asistencia en formato ISO (YYYY-MM-DD)",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiPropertyOptional({
    enum: AttendanceStatus,
    example: AttendanceStatus.JUSTIFICADO,
    description: "Estado de la asistencia",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase().trim() : value))
  @IsEnum(AttendanceStatus)
  @IsOptional()
  status?: AttendanceStatus;

  @ApiPropertyOptional({
    example: "Falta justificada con certificado.",
    description: "Observacion de asistencia (enviar null para limpiar)",
    nullable: true,
    maxLength: 255,
  })
  @Transform(({ value }) => toOptionalObservation(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observation?: string | null;
}
