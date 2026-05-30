import { Injectable, NotFoundException } from "@nestjs/common";
import {
  AlertStatus,
  AttendanceStatus,
  EnrollmentStatus,
  Prisma,
  RiskLevel,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { RiskLevelLabel } from "../risk-engine/dto/risk-evaluation-response.dto";
import {
  CourseRiskSummaryDto,
  DashboardReportDto,
  DashboardRiskDistributionDto,
  ReportActiveAlertDto,
  ReportAlertStatus,
  ReportAttendanceSummaryDto,
  ReportCurrentCourseDto,
  ReportGradeSummaryDto,
  ReportLatestRiskEvaluationDto,
  ReportRecentFollowUpDto,
  ReportStudentBasicDto,
  StudentFullReportDto,
  StudentsAtRiskItemDto,
} from "./dto/report-response.dto";

const ATTENDANCE_IRREGULAR_THRESHOLD = 3;
const LOW_PERFORMANCE_THRESHOLD = 51;
const ACTIVE_ALERT_STATUSES: AlertStatus[] = [AlertStatus.PENDIENTE, AlertStatus.EN_REVISION];

type RiskIndicatorsPayload = {
  attendanceIrregular?: boolean;
  lowAcademicPerformance?: boolean;
  relevantFollowUps?: boolean;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentsAtRisk(): Promise<StudentsAtRiskItemDto[]> {
    const students = await this.prisma.student.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        ci: true,
        evaluations: {
          select: {
            riskLevel: true,
            indicators: true,
            evaluatedAt: true,
          },
          orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
        alerts: {
          select: {
            status: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "desc" }],
        },
      },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const result = students.map((student) => {
      const latestEvaluation = student.evaluations[0];
      const alertStatus = this.resolveAlertStatus(student.alerts.map((alert) => alert.status));
      const lastRiskLevel = this.toRiskLevelLabel(latestEvaluation?.riskLevel);

      return {
        student: this.toStudentBasic(student),
        lastRiskLevel,
        activeIndicators: latestEvaluation
          ? this.extractActiveIndicators(latestEvaluation.indicators)
          : [],
        alertStatus,
      };
    });

    return result.filter(
      (item) =>
        item.lastRiskLevel !== RiskLevelLabel.SIN_RIESGO ||
        item.alertStatus === ReportAlertStatus.PENDIENTE ||
        item.alertStatus === ReportAlertStatus.EN_REVISION,
    );
  }

  async getCourseRiskSummary(courseId: string): Promise<CourseRiskSummaryDto> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        schoolYearId: true,
      },
    });

    if (!course) {
      throw new NotFoundException("Curso no encontrado.");
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId,
        status: EnrollmentStatus.ACTIVE,
        student: {
          isActive: true,
        },
      },
      select: {
        studentId: true,
      },
    });

    const uniqueStudentIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.studentId)));

    if (uniqueStudentIds.length === 0) {
      return {
        courseId,
        totalEstudiantes: 0,
        totalRiesgoBajo: 0,
        totalRiesgoMedio: 0,
        totalRiesgoAlto: 0,
        totalSinRiesgo: 0,
      };
    }

    const latestEvaluations = await this.prisma.riskEvaluation.findMany({
      where: {
        studentId: { in: uniqueStudentIds },
        schoolYearId: course.schoolYearId,
      },
      select: {
        studentId: true,
        riskLevel: true,
        evaluatedAt: true,
      },
      orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
    });

    const latestByStudent = new Map<string, RiskLevel>();

    for (const evaluation of latestEvaluations) {
      if (!latestByStudent.has(evaluation.studentId)) {
        latestByStudent.set(evaluation.studentId, evaluation.riskLevel);
      }
    }

    const summary = {
      totalRiesgoBajo: 0,
      totalRiesgoMedio: 0,
      totalRiesgoAlto: 0,
      totalSinRiesgo: 0,
    };

    for (const studentId of uniqueStudentIds) {
      const level = latestByStudent.get(studentId);

      if (!level || level === RiskLevel.NO_RISK) {
        summary.totalSinRiesgo += 1;
        continue;
      }

      if (level === RiskLevel.LOW) {
        summary.totalRiesgoBajo += 1;
        continue;
      }

      if (level === RiskLevel.MEDIUM) {
        summary.totalRiesgoMedio += 1;
        continue;
      }

      summary.totalRiesgoAlto += 1;
    }

    return {
      courseId,
      totalEstudiantes: uniqueStudentIds.length,
      totalRiesgoBajo: summary.totalRiesgoBajo,
      totalRiesgoMedio: summary.totalRiesgoMedio,
      totalRiesgoAlto: summary.totalRiesgoAlto,
      totalSinRiesgo: summary.totalSinRiesgo,
    };
  }

  async getStudentFullReport(studentId: string): Promise<StudentFullReportDto> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        ci: true,
      },
    });

    if (!student) {
      throw new NotFoundException("Estudiante no encontrado.");
    }

    const [currentEnrollment, attendanceRows, gradeRows, followUps, latestEvaluation, activeAlerts] =
      await this.prisma.$transaction([
        this.prisma.enrollment.findFirst({
          where: {
            studentId,
            status: EnrollmentStatus.ACTIVE,
            student: {
              isActive: true,
            },
          },
          select: {
            course: {
              select: {
                id: true,
                level: true,
                parallel: true,
                schoolYearId: true,
                schoolYear: {
                  select: {
                    name: true,
                    startDate: true,
                  },
                },
              },
            },
          },
          orderBy: [{ schoolYear: { startDate: "desc" } }, { createdAt: "desc" }],
        }),
        this.prisma.attendance.findMany({
          where: { studentId },
          select: { status: true },
        }),
        this.prisma.grade.findMany({
          where: { studentId },
          select: { subjectId: true, score: true },
        }),
        this.prisma.studentFollowUp.findMany({
          where: { studentId },
          select: {
            id: true,
            type: true,
            description: true,
            actionTaken: true,
            followUpDate: true,
            nextReviewDate: true,
            responsibleUser: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
          orderBy: [{ followUpDate: "desc" }, { createdAt: "desc" }],
          take: 5,
        }),
        this.prisma.riskEvaluation.findFirst({
          where: { studentId },
          select: {
            riskLevel: true,
            riskScore: true,
            attendanceRate: true,
            averageGrade: true,
            totalAbsences: true,
            indicators: true,
            evaluatedAt: true,
          },
          orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
        }),
        this.prisma.alert.findMany({
          where: {
            studentId,
            status: {
              in: ACTIVE_ALERT_STATUSES,
            },
          },
          select: {
            id: true,
            title: true,
            riskLevel: true,
            status: true,
            createdAt: true,
          },
          orderBy: [{ createdAt: "desc" }],
        }),
      ]);

    const attendanceSummary = this.buildAttendanceSummary(attendanceRows);
    const gradeSummary = this.buildGradeSummary(gradeRows);

    return {
      student: this.toStudentBasic(student),
      currentCourse: currentEnrollment
        ? this.toCurrentCourse(currentEnrollment.course)
        : null,
      attendanceSummary,
      gradeSummary,
      recentFollowUps: followUps.map((followUp) => this.toRecentFollowUp(followUp)),
      latestRiskEvaluation: latestEvaluation
        ? this.toLatestRiskEvaluation(latestEvaluation)
        : null,
      activeAlerts: activeAlerts.map((alert) => this.toActiveAlert(alert)),
    };
  }

  async getDashboardReport(): Promise<DashboardReportDto> {
    const [totalEstudiantes, alertasPendientes, allGrades, latestEvaluations] =
      await this.prisma.$transaction([
        this.prisma.student.count({
          where: { isActive: true },
        }),
        this.prisma.alert.count({
          where: { status: AlertStatus.PENDIENTE },
        }),
        this.prisma.grade.findMany({
          select: {
            score: true,
          },
        }),
        this.prisma.riskEvaluation.findMany({
          where: {
            student: {
              isActive: true,
            },
          },
          select: {
            studentId: true,
            riskLevel: true,
            indicators: true,
            evaluatedAt: true,
          },
          orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
        }),
      ]);

    const evaluationsByStudent = new Map<
      string,
      {
        riskLevel: RiskLevel;
        indicators: Prisma.JsonValue | null;
      }
    >();

    for (const evaluation of latestEvaluations) {
      if (!evaluationsByStudent.has(evaluation.studentId)) {
        evaluationsByStudent.set(evaluation.studentId, {
          riskLevel: evaluation.riskLevel,
          indicators: evaluation.indicators,
        });
      }
    }

    const gradeTotal = allGrades.reduce(
      (accumulator, grade) => accumulator + this.decimalToNumber(grade.score),
      0,
    );
    const promedioGeneral = this.roundTo2(
      allGrades.length === 0 ? 0 : gradeTotal / allGrades.length,
    );

    const distribution: DashboardRiskDistributionDto = {
      totalSinRiesgo: 0,
      totalRiesgoBajo: 0,
      totalRiesgoMedio: 0,
      totalRiesgoAlto: 0,
    };

    let estudiantesConRiesgo = 0;
    let estudiantesConAsistenciaIrregular = 0;
    let estudiantesConBajoRendimiento = 0;

    for (const evaluation of evaluationsByStudent.values()) {
      if (evaluation.riskLevel === RiskLevel.NO_RISK) {
        distribution.totalSinRiesgo += 1;
      } else if (evaluation.riskLevel === RiskLevel.LOW) {
        distribution.totalRiesgoBajo += 1;
        estudiantesConRiesgo += 1;
      } else if (evaluation.riskLevel === RiskLevel.MEDIUM) {
        distribution.totalRiesgoMedio += 1;
        estudiantesConRiesgo += 1;
      } else {
        distribution.totalRiesgoAlto += 1;
        estudiantesConRiesgo += 1;
      }

      const indicators = this.parseIndicators(evaluation.indicators);
      if (indicators.attendanceIrregular === true) {
        estudiantesConAsistenciaIrregular += 1;
      }
      if (indicators.lowAcademicPerformance === true) {
        estudiantesConBajoRendimiento += 1;
      }
    }

    return {
      totalEstudiantes,
      estudiantesConRiesgo,
      alertasPendientes,
      promedioGeneral,
      estudiantesConAsistenciaIrregular,
      estudiantesConBajoRendimiento,
      distribucionRiesgo: distribution,
    };
  }

  private toStudentBasic(student: {
    id: string;
    firstName: string;
    lastName: string;
    ci: string | null;
  }): ReportStudentBasicDto {
    return {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      ci: student.ci,
    };
  }

  private toCurrentCourse(course: {
    id: string;
    level: string;
    parallel: string;
    schoolYearId: string;
    schoolYear: { name: string };
  }): ReportCurrentCourseDto {
    return {
      id: course.id,
      level: course.level,
      parallel: course.parallel,
      schoolYearId: course.schoolYearId,
      schoolYearName: course.schoolYear.name,
    };
  }

  private buildAttendanceSummary(
    attendanceRows: Array<{
      status: AttendanceStatus;
    }>,
  ): ReportAttendanceSummaryDto {
    let totalPresentes = 0;
    let totalFaltas = 0;
    let totalAtrasos = 0;
    let totalJustificados = 0;

    for (const attendance of attendanceRows) {
      if (attendance.status === AttendanceStatus.PRESENTE) {
        totalPresentes += 1;
      } else if (attendance.status === AttendanceStatus.FALTA) {
        totalFaltas += 1;
      } else if (attendance.status === AttendanceStatus.ATRASO) {
        totalAtrasos += 1;
      } else if (attendance.status === AttendanceStatus.JUSTIFICADO) {
        totalJustificados += 1;
      }
    }

    const totalRegistros = totalPresentes + totalFaltas + totalAtrasos + totalJustificados;
    const attendanceRate = this.roundTo2(
      totalRegistros === 0 ? 0 : (totalPresentes / totalRegistros) * 100,
    );

    return {
      totalPresentes,
      totalFaltas,
      totalAtrasos,
      totalJustificados,
      attendanceRate,
      indicadorAsistenciaIrregular: totalFaltas + totalAtrasos >= ATTENDANCE_IRREGULAR_THRESHOLD,
    };
  }

  private buildGradeSummary(
    gradeRows: Array<{
      subjectId: string;
      score: Prisma.Decimal;
    }>,
  ): ReportGradeSummaryDto {
    const totalScores = gradeRows.reduce(
      (accumulator, grade) => accumulator + this.decimalToNumber(grade.score),
      0,
    );
    const promedioGeneral = this.roundTo2(
      gradeRows.length === 0 ? 0 : totalScores / gradeRows.length,
    );

    const scoresBySubject = new Map<string, number[]>();

    for (const grade of gradeRows) {
      const currentScores = scoresBySubject.get(grade.subjectId);
      const numericScore = this.decimalToNumber(grade.score);

      if (currentScores) {
        currentScores.push(numericScore);
      } else {
        scoresBySubject.set(grade.subjectId, [numericScore]);
      }
    }

    let materiasReprobadas = 0;

    for (const scores of scoresBySubject.values()) {
      const subjectTotal = scores.reduce((accumulator, score) => accumulator + score, 0);
      const subjectAverage = subjectTotal / scores.length;
      if (subjectAverage < LOW_PERFORMANCE_THRESHOLD) {
        materiasReprobadas += 1;
      }
    }

    return {
      promedioGeneral,
      materiasReprobadas,
      indicadorBajoRendimiento:
        promedioGeneral < LOW_PERFORMANCE_THRESHOLD || materiasReprobadas > 0,
    };
  }

  private toRecentFollowUp(followUp: {
    id: string;
    type: ReportRecentFollowUpDto["type"];
    description: string;
    actionTaken: string | null;
    followUpDate: Date;
    nextReviewDate: Date | null;
    responsibleUser: {
      id: string;
      fullName: string;
    };
  }): ReportRecentFollowUpDto {
    return {
      id: followUp.id,
      type: followUp.type,
      description: followUp.description,
      actionTaken: followUp.actionTaken,
      followUpDate: followUp.followUpDate,
      nextReviewDate: followUp.nextReviewDate,
      responsibleUser: {
        id: followUp.responsibleUser.id,
        fullName: followUp.responsibleUser.fullName,
      },
    };
  }

  private toLatestRiskEvaluation(evaluation: {
    riskLevel: RiskLevel;
    riskScore: Prisma.Decimal | null;
    attendanceRate: Prisma.Decimal | null;
    averageGrade: Prisma.Decimal | null;
    totalAbsences: number | null;
    indicators: Prisma.JsonValue | null;
    evaluatedAt: Date;
  }): ReportLatestRiskEvaluationDto {
    return {
      riskLevel: this.toRiskLevelLabel(evaluation.riskLevel),
      riskScore: evaluation.riskScore ? this.decimalToNumber(evaluation.riskScore) : null,
      attendanceRate: evaluation.attendanceRate
        ? this.decimalToNumber(evaluation.attendanceRate)
        : null,
      averageGrade: evaluation.averageGrade ? this.decimalToNumber(evaluation.averageGrade) : null,
      totalAbsences: evaluation.totalAbsences,
      activeIndicators: this.extractActiveIndicators(evaluation.indicators),
      evaluatedAt: evaluation.evaluatedAt,
    };
  }

  private toActiveAlert(alert: {
    id: string;
    title: string;
    riskLevel: RiskLevel;
    status: AlertStatus;
    createdAt: Date;
  }): ReportActiveAlertDto {
    return {
      id: alert.id,
      title: alert.title,
      riskLevel: this.toRiskLevelLabel(alert.riskLevel),
      status: alert.status,
      createdAt: alert.createdAt,
    };
  }

  private resolveAlertStatus(statuses: AlertStatus[]): ReportAlertStatus {
    if (statuses.includes(AlertStatus.PENDIENTE)) {
      return ReportAlertStatus.PENDIENTE;
    }

    if (statuses.includes(AlertStatus.EN_REVISION)) {
      return ReportAlertStatus.EN_REVISION;
    }

    if (statuses.includes(AlertStatus.ATENDIDA)) {
      return ReportAlertStatus.ATENDIDA;
    }

    if (statuses.includes(AlertStatus.DESCARTADA)) {
      return ReportAlertStatus.DESCARTADA;
    }

    return ReportAlertStatus.SIN_ALERTA;
  }

  private extractActiveIndicators(indicators: Prisma.JsonValue | null): string[] {
    const parsed = this.parseIndicators(indicators);
    const activeIndicators: string[] = [];

    if (parsed.attendanceIrregular === true) {
      activeIndicators.push("asistenciaIrregular");
    }

    if (parsed.lowAcademicPerformance === true) {
      activeIndicators.push("bajoRendimientoAcademico");
    }

    if (parsed.relevantFollowUps === true) {
      activeIndicators.push("seguimientosRelevantes");
    }

    return activeIndicators;
  }

  private parseIndicators(indicators: Prisma.JsonValue | null): RiskIndicatorsPayload {
    if (!indicators || typeof indicators !== "object" || Array.isArray(indicators)) {
      return {};
    }

    const maybeIndicators = indicators as Record<string, unknown>;

    return {
      attendanceIrregular:
        typeof maybeIndicators.attendanceIrregular === "boolean"
          ? maybeIndicators.attendanceIrregular
          : undefined,
      lowAcademicPerformance:
        typeof maybeIndicators.lowAcademicPerformance === "boolean"
          ? maybeIndicators.lowAcademicPerformance
          : undefined,
      relevantFollowUps:
        typeof maybeIndicators.relevantFollowUps === "boolean"
          ? maybeIndicators.relevantFollowUps
          : undefined,
    };
  }

  private toRiskLevelLabel(riskLevel?: RiskLevel): RiskLevelLabel {
    if (!riskLevel || riskLevel === RiskLevel.NO_RISK) {
      return RiskLevelLabel.SIN_RIESGO;
    }

    if (riskLevel === RiskLevel.LOW) {
      return RiskLevelLabel.BAJO;
    }

    if (riskLevel === RiskLevel.MEDIUM) {
      return RiskLevelLabel.MEDIO;
    }

    return RiskLevelLabel.ALTO;
  }

  private roundTo2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private decimalToNumber(value: Prisma.Decimal): number {
    return Number(value);
  }
}
