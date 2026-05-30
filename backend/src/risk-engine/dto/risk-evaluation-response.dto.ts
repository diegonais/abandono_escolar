import { ApiProperty } from "@nestjs/swagger";

export enum RiskLevelLabel {
  BAJO = "BAJO",
  MEDIO = "MEDIO",
  ALTO = "ALTO",
  SIN_RIESGO = "SIN_RIESGO",
}

export class RiskIndicatorsDto {
  @ApiProperty()
  attendanceIrregular!: boolean;

  @ApiProperty()
  lowAcademicPerformance!: boolean;

  @ApiProperty()
  relevantFollowUps!: boolean;
}

export class RiskDetailsDto {
  @ApiProperty({ minimum: 0 })
  absencesCount!: number;

  @ApiProperty({ minimum: 0 })
  delaysCount!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  averageGrade!: number;

  @ApiProperty({ minimum: 0 })
  failedSubjectsCount!: number;

  @ApiProperty({ minimum: 0 })
  followUpsCount!: number;
}

export class RiskEvaluationResponseDto {
  @ApiProperty()
  studentId!: string;

  @ApiProperty({ enum: RiskLevelLabel })
  riskLevel!: RiskLevelLabel;

  @ApiProperty({ type: RiskIndicatorsDto })
  indicators!: RiskIndicatorsDto;

  @ApiProperty({ type: RiskDetailsDto })
  details!: RiskDetailsDto;
}
