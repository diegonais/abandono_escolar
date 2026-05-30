import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AlertStatus, FollowUpType } from "@prisma/client";
import { RiskLevelLabel } from "../../risk-engine/dto/risk-evaluation-response.dto";

export enum ReportAlertStatus {
  SIN_ALERTA = "SIN_ALERTA",
  PENDIENTE = "PENDIENTE",
  EN_REVISION = "EN_REVISION",
  ATENDIDA = "ATENDIDA",
  DESCARTADA = "DESCARTADA",
}

export class ReportStudentBasicDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiPropertyOptional({ nullable: true })
  ci!: string | null;
}

export class StudentsAtRiskItemDto {
  @ApiProperty({ type: ReportStudentBasicDto })
  student!: ReportStudentBasicDto;

  @ApiProperty({ enum: RiskLevelLabel })
  lastRiskLevel!: RiskLevelLabel;

  @ApiProperty({ type: [String] })
  activeIndicators!: string[];

  @ApiProperty({ enum: ReportAlertStatus })
  alertStatus!: ReportAlertStatus;
}

export class CourseRiskSummaryDto {
  @ApiProperty()
  courseId!: string;

  @ApiProperty({ minimum: 0 })
  totalEstudiantes!: number;

  @ApiProperty({ minimum: 0 })
  totalRiesgoBajo!: number;

  @ApiProperty({ minimum: 0 })
  totalRiesgoMedio!: number;

  @ApiProperty({ minimum: 0 })
  totalRiesgoAlto!: number;

  @ApiProperty({ minimum: 0 })
  totalSinRiesgo!: number;
}

export class ReportCurrentCourseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  level!: string;

  @ApiProperty()
  parallel!: string;

  @ApiProperty()
  schoolYearId!: string;

  @ApiProperty()
  schoolYearName!: string;
}

export class ReportAttendanceSummaryDto {
  @ApiProperty({ minimum: 0 })
  totalPresentes!: number;

  @ApiProperty({ minimum: 0 })
  totalFaltas!: number;

  @ApiProperty({ minimum: 0 })
  totalAtrasos!: number;

  @ApiProperty({ minimum: 0 })
  totalJustificados!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  attendanceRate!: number;

  @ApiProperty()
  indicadorAsistenciaIrregular!: boolean;
}

export class ReportGradeSummaryDto {
  @ApiProperty({ minimum: 0, maximum: 100 })
  promedioGeneral!: number;

  @ApiProperty({ minimum: 0 })
  materiasReprobadas!: number;

  @ApiProperty()
  indicadorBajoRendimiento!: boolean;
}

export class ReportFollowUpResponsibleUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;
}

export class ReportRecentFollowUpDto {
  @ApiProperty()
  id!: string;

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

  @ApiProperty({ type: ReportFollowUpResponsibleUserDto })
  responsibleUser!: ReportFollowUpResponsibleUserDto;
}

export class ReportLatestRiskEvaluationDto {
  @ApiProperty({ enum: RiskLevelLabel })
  riskLevel!: RiskLevelLabel;

  @ApiPropertyOptional({ minimum: 0, nullable: true })
  riskScore!: number | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, nullable: true })
  attendanceRate!: number | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 100, nullable: true })
  averageGrade!: number | null;

  @ApiPropertyOptional({ minimum: 0, nullable: true })
  totalAbsences!: number | null;

  @ApiProperty({ type: [String] })
  activeIndicators!: string[];

  @ApiProperty()
  evaluatedAt!: Date;
}

export class ReportActiveAlertDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ enum: RiskLevelLabel })
  riskLevel!: RiskLevelLabel;

  @ApiProperty({ enum: AlertStatus })
  status!: AlertStatus;

  @ApiProperty()
  createdAt!: Date;
}

export class StudentFullReportDto {
  @ApiProperty({ type: ReportStudentBasicDto })
  student!: ReportStudentBasicDto;

  @ApiPropertyOptional({ type: ReportCurrentCourseDto, nullable: true })
  currentCourse!: ReportCurrentCourseDto | null;

  @ApiProperty({ type: ReportAttendanceSummaryDto })
  attendanceSummary!: ReportAttendanceSummaryDto;

  @ApiProperty({ type: ReportGradeSummaryDto })
  gradeSummary!: ReportGradeSummaryDto;

  @ApiProperty({ type: [ReportRecentFollowUpDto] })
  recentFollowUps!: ReportRecentFollowUpDto[];

  @ApiPropertyOptional({ type: ReportLatestRiskEvaluationDto, nullable: true })
  latestRiskEvaluation!: ReportLatestRiskEvaluationDto | null;

  @ApiProperty({ type: [ReportActiveAlertDto] })
  activeAlerts!: ReportActiveAlertDto[];
}

export class DashboardRiskDistributionDto {
  @ApiProperty({ minimum: 0 })
  totalSinRiesgo!: number;

  @ApiProperty({ minimum: 0 })
  totalRiesgoBajo!: number;

  @ApiProperty({ minimum: 0 })
  totalRiesgoMedio!: number;

  @ApiProperty({ minimum: 0 })
  totalRiesgoAlto!: number;
}

export class DashboardReportDto {
  @ApiProperty({ minimum: 0 })
  totalEstudiantes!: number;

  @ApiProperty({ minimum: 0 })
  estudiantesConRiesgo!: number;

  @ApiProperty({ minimum: 0 })
  alertasPendientes!: number;

  @ApiProperty({ minimum: 0, maximum: 100 })
  promedioGeneral!: number;

  @ApiProperty({ minimum: 0 })
  estudiantesConAsistenciaIrregular!: number;

  @ApiProperty({ minimum: 0 })
  estudiantesConBajoRendimiento!: number;

  @ApiProperty({ type: DashboardRiskDistributionDto })
  distribucionRiesgo!: DashboardRiskDistributionDto;
}
