import { ApiProperty } from "@nestjs/swagger";

export class SubjectResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  code!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class SubjectsPaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedSubjectsResponseDto {
  @ApiProperty({ type: [SubjectResponseDto] })
  data!: SubjectResponseDto[];

  @ApiProperty({ type: SubjectsPaginationMetaDto })
  meta!: SubjectsPaginationMetaDto;
}
