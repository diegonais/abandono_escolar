import { ApiProperty } from "@nestjs/swagger";
import { AcademicPeriod } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsNumber, IsUUID, Max, Min } from "class-validator";

export class CreateGradeDto {
  @ApiProperty({
    example: "a8ad2ea8-69c8-4b95-aa81-c0a775acbb77",
    description: "ID del estudiante",
    format: "uuid",
  })
  @IsUUID()
  studentId!: string;

  @ApiProperty({
    example: "9858f3c0-f4ec-4bd9-bcd9-b2df56056df2",
    description: "ID de la materia",
    format: "uuid",
  })
  @IsUUID()
  subjectId!: string;

  @ApiProperty({
    example: "08ed9fdd-1d5a-4fd9-b17f-bbc38345ea5f",
    description: "ID del curso",
    format: "uuid",
  })
  @IsUUID()
  courseId!: string;

  @ApiProperty({
    enum: AcademicPeriod,
    example: AcademicPeriod.BIMESTRE_1,
    description: "Periodo academico de la nota",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase().trim() : value))
  @IsEnum(AcademicPeriod)
  period!: AcademicPeriod;

  @ApiProperty({
    example: 78.5,
    description: "Calificacion final para el periodo (0-100)",
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber({ allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  score!: number;
}
