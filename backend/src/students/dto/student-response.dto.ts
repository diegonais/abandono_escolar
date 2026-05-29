import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class StudentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  ci!: string | null;

  @ApiPropertyOptional({ nullable: true })
  birthDate!: Date | null;

  @ApiPropertyOptional({ nullable: true })
  gender!: string | null;

  @ApiPropertyOptional({ nullable: true })
  tutorName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  tutorPhone!: string | null;

  @ApiPropertyOptional({ nullable: true })
  address!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class StudentsPaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedStudentsResponseDto {
  @ApiProperty({ type: [StudentResponseDto] })
  data!: StudentResponseDto[];

  @ApiProperty({ type: StudentsPaginationMetaDto })
  meta!: StudentsPaginationMetaDto;
}
