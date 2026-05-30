import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AlertStatus } from "@prisma/client";
import { RiskLevelLabel } from "../../risk-engine/dto/risk-evaluation-response.dto";

export class AlertStudentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  ci!: string | null;
}

export class AlertRiskEvaluationDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: RiskLevelLabel })
  riskLevel!: RiskLevelLabel;

  @ApiProperty()
  evaluatedAt!: Date;
}

export class AlertResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ enum: RiskLevelLabel })
  riskLevel!: RiskLevelLabel;

  @ApiProperty({ enum: AlertStatus })
  status!: AlertStatus;

  @ApiProperty()
  studentId!: string;

  @ApiProperty()
  schoolYearId!: string;

  @ApiPropertyOptional({ nullable: true })
  riskEvaluationId!: string | null;

  @ApiProperty({ type: AlertStudentDto })
  student!: AlertStudentDto;

  @ApiPropertyOptional({ type: AlertRiskEvaluationDto, nullable: true })
  riskEvaluation!: AlertRiskEvaluationDto | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class AlertGenerationResultDto {
  @ApiProperty()
  generated!: boolean;

  @ApiProperty()
  studentId!: string;

  @ApiPropertyOptional()
  message?: string;

  @ApiPropertyOptional({ type: AlertResponseDto })
  alert?: AlertResponseDto;
}

export class AlertBulkGenerationResultDto {
  @ApiProperty({ minimum: 0 })
  totalStudents!: number;

  @ApiProperty({ minimum: 0 })
  generatedCount!: number;

  @ApiProperty({ minimum: 0 })
  skippedNoRiskCount!: number;

  @ApiProperty({ minimum: 0 })
  skippedDuplicatePendingCount!: number;

  @ApiProperty({ type: [AlertGenerationResultDto] })
  results!: AlertGenerationResultDto[];
}
