import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EnrollmentStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export class CreateEnrollmentDto {
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
    example: "0f53f47d-cfae-45d8-bd18-7aed3784f184",
    description: "ID de la gestion escolar",
    format: "uuid",
  })
  @IsUUID()
  schoolYearId!: string;

  @ApiPropertyOptional({
    enum: EnrollmentStatus,
    example: EnrollmentStatus.ACTIVE,
    description: "Estado de la inscripcion",
    default: EnrollmentStatus.ACTIVE,
  })
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus = EnrollmentStatus.ACTIVE;
}
