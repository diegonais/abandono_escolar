import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FollowUpType, RoleName } from "@prisma/client";

export class StudentFollowUpStudentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  ci!: string | null;
}

export class StudentFollowUpResponsibleUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: RoleName })
  role!: RoleName;
}

export class StudentFollowUpResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  responsibleUserId!: string;

  @ApiProperty({ enum: FollowUpType })
  type!: FollowUpType;

  @ApiProperty()
  description!: string;

  @ApiPropertyOptional({ nullable: true })
  actionTaken!: string | null;

  @ApiProperty()
  followUpDate!: Date;

  @ApiPropertyOptional({ nullable: true })
  nextReviewDate!: Date | null;

  @ApiProperty({ type: StudentFollowUpStudentDto })
  student!: StudentFollowUpStudentDto;

  @ApiProperty({ type: StudentFollowUpResponsibleUserDto })
  responsibleUser!: StudentFollowUpResponsibleUserDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class StudentFollowUpsTotalByTypeDto {
  @ApiProperty({ minimum: 0 })
  ACADEMICO!: number;

  @ApiProperty({ minimum: 0 })
  CONDUCTUAL!: number;

  @ApiProperty({ minimum: 0 })
  FAMILIAR!: number;

  @ApiProperty({ minimum: 0 })
  ECONOMICO!: number;

  @ApiProperty({ minimum: 0 })
  SOCIAL!: number;

  @ApiProperty({ minimum: 0 })
  OTRO!: number;
}

export class StudentFollowUpsSummaryResponseDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty({ minimum: 0 })
  totalSeguimientos!: number;

  @ApiProperty({ type: StudentFollowUpsTotalByTypeDto })
  totalPorTipo!: StudentFollowUpsTotalByTypeDto;

  @ApiProperty({ type: [StudentFollowUpResponseDto] })
  ultimosSeguimientos!: StudentFollowUpResponseDto[];
}
