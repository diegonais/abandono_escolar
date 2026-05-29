import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AttendanceStatus } from "@prisma/client";

export class AttendanceStudentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  ci!: string | null;
}

export class AttendanceCourseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  level!: string;

  @ApiProperty()
  parallel!: string;

  @ApiProperty()
  schoolYearId!: string;
}

export class AttendanceResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  courseId!: string;

  @ApiProperty()
  date!: Date;

  @ApiProperty({ enum: AttendanceStatus })
  status!: AttendanceStatus;

  @ApiPropertyOptional({ nullable: true })
  observation!: string | null;

  @ApiProperty({ type: AttendanceStudentDto })
  student!: AttendanceStudentDto;

  @ApiProperty({ type: AttendanceCourseDto })
  course!: AttendanceCourseDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AttendanceSummaryRangeDto {
  @ApiPropertyOptional({ nullable: true })
  dateFrom!: string | null;

  @ApiPropertyOptional({ nullable: true })
  dateTo!: string | null;
}

export class AttendanceSummaryResponseDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  totalPresentes!: number;

  @ApiProperty()
  totalFaltas!: number;

  @ApiProperty()
  totalAtrasos!: number;

  @ApiProperty()
  totalJustificados!: number;

  @ApiProperty({ type: AttendanceSummaryRangeDto })
  rangoUsado!: AttendanceSummaryRangeDto;
}
