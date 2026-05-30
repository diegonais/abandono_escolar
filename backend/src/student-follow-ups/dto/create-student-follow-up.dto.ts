import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FollowUpType } from "@prisma/client";
import { Transform } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateStudentFollowUpDto {
  @ApiProperty({
    example: "a8ad2ea8-69c8-4b95-aa81-c0a775acbb77",
    description: "ID del estudiante",
    format: "uuid",
  })
  @IsUUID()
  studentId!: string;

  @ApiProperty({
    enum: FollowUpType,
    example: FollowUpType.ACADEMICO,
    description: "Tipo de seguimiento",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase().trim() : value))
  @IsEnum(FollowUpType)
  type!: FollowUpType;

  @ApiProperty({
    example: "Se detecto baja participacion en clase y retraso en entregas.",
    description: "Descripcion del seguimiento u observacion",
    minLength: 5,
    maxLength: 2000,
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  description!: string;

  @ApiPropertyOptional({
    example: "Se contacto al tutor y se acordo plan de refuerzo semanal.",
    description: "Accion tomada durante el seguimiento",
    maxLength: 2000,
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  actionTaken?: string;

  @ApiProperty({
    example: "2026-05-30",
    description: "Fecha del seguimiento",
  })
  @IsDateString()
  followUpDate!: string;

  @ApiPropertyOptional({
    example: "2026-06-15",
    description: "Fecha de la siguiente revision",
  })
  @IsDateString()
  @IsOptional()
  nextReviewDate?: string;
}
