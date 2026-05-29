import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AttendanceStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

function toTrimmedOptionalString(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export class CreateAttendanceDto {
  @ApiProperty({
    example: "a8ad2ea8-69c8-4b95-aa81-c0a775acbb77",
    description: "ID del estudiante",
    format: "uuid",
  })
  @IsUUID()
  studentId!: string;

  @ApiProperty({
    example: "08ed9fdd-1d5a-4fd9-b17f-bbc38345ea5f",
    description: "ID del curso",
    format: "uuid",
  })
  @IsUUID()
  courseId!: string;

  @ApiProperty({
    example: "2026-05-20",
    description: "Fecha de asistencia en formato ISO (YYYY-MM-DD)",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsDateString()
  date!: string;

  @ApiProperty({
    enum: AttendanceStatus,
    example: AttendanceStatus.PRESENTE,
    description: "Estado de la asistencia",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase().trim() : value))
  @IsEnum(AttendanceStatus)
  status!: AttendanceStatus;

  @ApiPropertyOptional({
    example: "Ingreso 10 minutos tarde por transporte.",
    description: "Observacion adicional",
    maxLength: 255,
  })
  @Transform(({ value }) => toTrimmedOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  observation?: string;
}
