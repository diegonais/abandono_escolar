import { ApiProperty } from "@nestjs/swagger";

export class SchoolYearResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  startDate!: Date;

  @ApiProperty()
  endDate!: Date;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class SchoolYearsPaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedSchoolYearsResponseDto {
  @ApiProperty({ type: [SchoolYearResponseDto] })
  data!: SchoolYearResponseDto[];

  @ApiProperty({ type: SchoolYearsPaginationMetaDto })
  meta!: SchoolYearsPaginationMetaDto;
}
