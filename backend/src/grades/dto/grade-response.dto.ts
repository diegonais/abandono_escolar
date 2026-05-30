import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AcademicPeriod } from "@prisma/client";

export class GradeStudentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  ci!: string | null;
}

export class GradeSubjectDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ nullable: true })
  code!: string | null;
}

export class GradeCourseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  level!: string;

  @ApiProperty()
  parallel!: string;

  @ApiProperty()
  schoolYearId!: string;
}

export class GradeResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  subjectId!: string;

  @ApiProperty()
  courseId!: string;

  @ApiProperty({ enum: AcademicPeriod })
  period!: AcademicPeriod;

  @ApiProperty({ minimum: 0, maximum: 100 })
  score!: number;

  @ApiProperty({ type: GradeStudentDto })
  student!: GradeStudentDto;

  @ApiProperty({ type: GradeSubjectDto })
  subject!: GradeSubjectDto;

  @ApiProperty({ type: GradeCourseDto })
  course!: GradeCourseDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class GradeSummaryPeriodScoreDto {
  @ApiProperty({ enum: AcademicPeriod })
  period!: AcademicPeriod;

  @ApiProperty({ minimum: 0, maximum: 100 })
  score!: number;
}

export class GradeSummarySubjectDto {
  @ApiProperty()
  subjectId!: string;

  @ApiProperty()
  subjectName!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  promedioMateria!: number;

  @ApiProperty()
  estaReprobada!: boolean;

  @ApiProperty({ type: [GradeSummaryPeriodScoreDto] })
  periodos!: GradeSummaryPeriodScoreDto[];
}

export class GradeStudentSummaryResponseDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  promedioGeneral!: number;

  @ApiProperty({
    description: "Cantidad de materias con promedio menor a 51",
    minimum: 0,
  })
  materiasReprobadas!: number;

  @ApiProperty({ type: [GradeSummarySubjectDto] })
  notasPorMateria!: GradeSummarySubjectDto[];

  @ApiProperty()
  indicadorBajoRendimiento!: boolean;
}
