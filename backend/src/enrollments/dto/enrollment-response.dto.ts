import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EnrollmentStatus } from "@prisma/client";

export class EnrollmentStudentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  ci!: string | null;
}

export class EnrollmentCourseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  level!: string;

  @ApiProperty()
  parallel!: string;

  @ApiProperty()
  schoolYearId!: string;
}

export class EnrollmentSchoolYearDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class EnrollmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  schoolYearId!: string;

  @ApiProperty({ enum: EnrollmentStatus })
  status!: EnrollmentStatus;

  @ApiProperty({ type: EnrollmentStudentDto })
  student!: EnrollmentStudentDto;

  @ApiProperty({ type: EnrollmentCourseDto })
  course!: EnrollmentCourseDto;

  @ApiProperty({ type: EnrollmentSchoolYearDto })
  schoolYear!: EnrollmentSchoolYearDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class EnrollmentsPaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedEnrollmentsResponseDto {
  @ApiProperty({ type: [EnrollmentResponseDto] })
  data!: EnrollmentResponseDto[];

  @ApiProperty({ type: EnrollmentsPaginationMetaDto })
  meta!: EnrollmentsPaginationMetaDto;
}
