import { Injectable, NotFoundException } from "@nestjs/common";
import { AlertStatus, Prisma, RiskLevel } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RiskEvaluationResponseDto, RiskLevelLabel } from "../risk-engine/dto/risk-evaluation-response.dto";
import { RiskEngineService } from "../risk-engine/risk-engine.service";
import {
  AlertBulkGenerationResultDto,
  AlertGenerationResultDto,
  AlertResponseDto,
} from "./dto/alert-response.dto";
import { UpdateAlertStatusDto } from "./dto/update-alert-status.dto";

type AlertWithRelations = Prisma.AlertGetPayload<{
  include: {
    student: true;
    riskEvaluation: true;
  };
}>;

@Injectable()
export class AlertsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly riskEngineService: RiskEngineService,
  ) {}

  async findAll(): Promise<AlertResponseDto[]> {
    const alerts = await this.prisma.alert.findMany({
      include: {
        student: true,
        riskEvaluation: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return alerts.map((alert) => this.toAlertResponse(alert));
  }

  async findOne(id: string): Promise<AlertResponseDto> {
    const alert = await this.prisma.alert.findUnique({
      where: { id },
      include: {
        student: true,
        riskEvaluation: true,
      },
    });

    if (!alert) {
      throw new NotFoundException("Alerta no encontrada.");
    }

    return this.toAlertResponse(alert);
  }

  async findByStudent(studentId: string): Promise<AlertResponseDto[]> {
    await this.ensureStudentExists(studentId);

    const alerts = await this.prisma.alert.findMany({
      where: { studentId },
      include: {
        student: true,
        riskEvaluation: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    return alerts.map((alert) => this.toAlertResponse(alert));
  }

  async updateStatus(id: string, dto: UpdateAlertStatusDto): Promise<AlertResponseDto> {
    await this.ensureAlertExists(id);

    const updatedAlert = await this.prisma.alert.update({
      where: { id },
      data: {
        status: dto.status,
      },
      include: {
        student: true,
        riskEvaluation: true,
      },
    });

    return this.toAlertResponse(updatedAlert);
  }

  async generateForStudent(studentId: string): Promise<AlertGenerationResultDto> {
    const evaluation = await this.riskEngineService.evaluateStudentRisk(studentId);

    if (evaluation.riskLevel === RiskLevelLabel.SIN_RIESGO) {
      return {
        generated: false,
        studentId,
        message: "No se genero alerta porque el riesgo es SIN_RIESGO.",
      };
    }

    const resolvedRiskLevel = this.toPrismaRiskLevel(evaluation.riskLevel);

    const existingPendingAlert = await this.prisma.alert.findFirst({
      where: {
        studentId,
        riskLevel: resolvedRiskLevel,
        status: AlertStatus.PENDIENTE,
      },
      select: { id: true },
    });

    if (existingPendingAlert) {
      return {
        generated: false,
        studentId,
        message:
          "No se genero alerta porque ya existe una alerta PENDIENTE para el mismo nivel de riesgo.",
      };
    }

    const latestRiskEvaluation = await this.prisma.riskEvaluation.findFirst({
      where: {
        studentId,
        riskLevel: resolvedRiskLevel,
      },
      select: {
        id: true,
        schoolYearId: true,
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const createdAlert = await this.prisma.alert.create({
      data: {
        title: this.buildAlertTitle(evaluation.riskLevel),
        description: this.buildAlertDescription(evaluation),
        riskLevel: resolvedRiskLevel,
        status: AlertStatus.PENDIENTE,
        studentId,
        schoolYearId: latestRiskEvaluation?.schoolYearId ?? (await this.getActiveSchoolYearId()),
        riskEvaluationId: latestRiskEvaluation?.id ?? null,
      },
      include: {
        student: true,
        riskEvaluation: true,
      },
    });

    return {
      generated: true,
      studentId,
      message: "Alerta generada correctamente.",
      alert: this.toAlertResponse(createdAlert),
    };
  }

  async generateForAllStudents(): Promise<AlertBulkGenerationResultDto> {
    const activeStudents = await this.prisma.student.findMany({
      where: { isActive: true },
      select: { id: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const results: AlertGenerationResultDto[] = [];

    for (const student of activeStudents) {
      const result = await this.generateForStudent(student.id);
      results.push(result);
    }

    return {
      totalStudents: activeStudents.length,
      generatedCount: results.filter((item) => item.generated).length,
      skippedNoRiskCount: results.filter(
        (item) => !item.generated && item.message?.includes("SIN_RIESGO"),
      ).length,
      skippedDuplicatePendingCount: results.filter(
        (item) => !item.generated && item.message?.includes("PENDIENTE"),
      ).length,
      results,
    };
  }

  private async ensureStudentExists(studentId: string): Promise<void> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true },
    });

    if (!student) {
      throw new NotFoundException("Estudiante no encontrado.");
    }
  }

  private async ensureAlertExists(alertId: string): Promise<void> {
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
      select: { id: true },
    });

    if (!alert) {
      throw new NotFoundException("Alerta no encontrada.");
    }
  }

  private async getActiveSchoolYearId(): Promise<string> {
    const activeSchoolYear = await this.prisma.schoolYear.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: [{ startDate: "desc" }],
    });

    if (!activeSchoolYear) {
      throw new NotFoundException(
        "No existe una gestion escolar activa para generar alertas.",
      );
    }

    return activeSchoolYear.id;
  }

  private buildAlertTitle(riskLevel: RiskLevelLabel): string {
    return `Alerta preventiva de riesgo ${riskLevel}`;
  }

  private buildAlertDescription(evaluation: RiskEvaluationResponseDto): string {
    const activeIndicators = [
      evaluation.indicators.attendanceIrregular ? "asistencia irregular" : null,
      evaluation.indicators.lowAcademicPerformance ? "bajo rendimiento academico" : null,
      evaluation.indicators.relevantFollowUps ? "seguimientos relevantes" : null,
    ].filter((item): item is string => item !== null);

    return `Se detecto riesgo ${evaluation.riskLevel} para el estudiante por: ${activeIndicators.join(", ")}. Promedio: ${evaluation.details.averageGrade}, faltas: ${evaluation.details.absencesCount}, atrasos: ${evaluation.details.delaysCount}, seguimientos: ${evaluation.details.followUpsCount}.`;
  }

  private toPrismaRiskLevel(riskLevel: RiskLevelLabel): RiskLevel {
    if (riskLevel === RiskLevelLabel.BAJO) {
      return RiskLevel.LOW;
    }

    if (riskLevel === RiskLevelLabel.MEDIO) {
      return RiskLevel.MEDIUM;
    }

    return RiskLevel.HIGH;
  }

  private toRiskLevelLabel(riskLevel: RiskLevel): RiskLevelLabel {
    if (riskLevel === RiskLevel.LOW) {
      return RiskLevelLabel.BAJO;
    }

    if (riskLevel === RiskLevel.MEDIUM) {
      return RiskLevelLabel.MEDIO;
    }

    if (riskLevel === RiskLevel.HIGH) {
      return RiskLevelLabel.ALTO;
    }

    if (riskLevel === RiskLevel.CRITICAL) {
      return RiskLevelLabel.ALTO;
    }

    return RiskLevelLabel.SIN_RIESGO;
  }

  private toAlertResponse(alert: AlertWithRelations): AlertResponseDto {
    return {
      id: alert.id,
      title: alert.title,
      description: alert.description,
      riskLevel: this.toRiskLevelLabel(alert.riskLevel),
      status: alert.status,
      studentId: alert.studentId,
      schoolYearId: alert.schoolYearId,
      riskEvaluationId: alert.riskEvaluationId,
      student: {
        id: alert.student.id,
        firstName: alert.student.firstName,
        lastName: alert.student.lastName,
        ci: alert.student.ci,
      },
      riskEvaluation: alert.riskEvaluation
        ? {
            id: alert.riskEvaluation.id,
            riskLevel: this.toRiskLevelLabel(alert.riskEvaluation.riskLevel),
            evaluatedAt: alert.riskEvaluation.evaluatedAt,
          }
        : null,
      createdAt: alert.createdAt,
      updatedAt: alert.updatedAt,
    };
  }
}
