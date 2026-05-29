import { ApiProperty } from "@nestjs/swagger";

export class CourseSchoolYearDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class CourseResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  level!: string;

  @ApiProperty()
  parallel!: string;

  @ApiProperty()
  schoolYearId!: string;

  @ApiProperty({ type: CourseSchoolYearDto })
  schoolYear!: CourseSchoolYearDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class CoursesPaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedCoursesResponseDto {
  @ApiProperty({ type: [CourseResponseDto] })
  data!: CourseResponseDto[];

  @ApiProperty({ type: CoursesPaginationMetaDto })
  meta!: CoursesPaginationMetaDto;
}
