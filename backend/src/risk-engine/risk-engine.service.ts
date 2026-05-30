import { Injectable, NotFoundException } from "@nestjs/common";
import { AttendanceStatus, Prisma, RiskLevel } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  RiskEvaluationResponseDto,
  RiskLevelLabel,
} from "./dto/risk-evaluation-response.dto";

const ATTENDANCE_WINDOW_DAYS = 30;
const FOLLOW_UP_WINDOW_DAYS = 60;
const ATTENDANCE_INCIDENTS_THRESHOLD = 3;
const AVERAGE_GRADE_THRESHOLD = 51;
const FAILED_SUBJECTS_THRESHOLD = 2;
const RELEVANT_FOLLOW_UPS_THRESHOLD = 2;

@Injectable()
export class RiskEngineService {
  constructor(private readonly prisma: PrismaService) {}

  async evaluateStudentRisk(studentId: string): Promise<RiskEvaluationResponseDto> {
    const schoolYearId = await this.getActiveSchoolYearId();
    return this.evaluateAndPersist(studentId, schoolYearId);
  }

  async evaluateAllStudents(): Promise<RiskEvaluationResponseDto[]> {
    const schoolYearId = await this.getActiveSchoolYearId();

    const activeStudents = await this.prisma.student.findMany({
      where: { isActive: true },
      select: { id: true },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    });

    const results: RiskEvaluationResponseDto[] = [];

    for (const student of activeStudents) {
      const evaluation = await this.evaluateAndPersist(student.id, schoolYearId);
      results.push(evaluation);
    }

    return results;
  }

  private async evaluateAndPersist(
    studentId: string,
    schoolYearId: string,
  ): Promise<RiskEvaluationResponseDto> {
    await this.ensureStudentExists(studentId);

    const now = new Date();
    const attendanceFromDate = this.subDays(now, ATTENDANCE_WINDOW_DAYS);
    const followUpsFromDate = this.subDays(now, FOLLOW_UP_WINDOW_DAYS);

    const [attendanceRecords, gradeRecords, followUpsCount] = await this.prisma.$transaction([
      this.prisma.attendance.findMany({
        where: {
          studentId,
          date: {
            gte: attendanceFromDate,
          },
        },
        select: {
          status: true,
        },
      }),
      this.prisma.grade.findMany({
        where: {
          studentId,
          course: {
            schoolYearId,
          },
        },
        select: {
          subjectId: true,
          score: true,
        },
      }),
      this.prisma.studentFollowUp.count({
        where: {
          studentId,
          followUpDate: {
            gte: followUpsFromDate,
          },
        },
      }),
    ]);

    const attendanceCountMap = this.buildAttendanceCountMap(attendanceRecords);
    const absencesCount = attendanceCountMap[AttendanceStatus.FALTA];
    const delaysCount = attendanceCountMap[AttendanceStatus.ATRASO];
    const attendanceIncidents = absencesCount + delaysCount;

    const totalScores = gradeRecords.reduce(
      (accumulator, grade) => accumulator + this.decimalToNumber(grade.score),
      0,
    );

    const averageGrade = this.roundTo2(
      gradeRecords.length === 0 ? 0 : totalScores / gradeRecords.length,
    );

    const scoresBySubject = new Map<string, number[]>();

    for (const grade of gradeRecords) {
      const currentScores = scoresBySubject.get(grade.subjectId);

      if (currentScores) {
        currentScores.push(this.decimalToNumber(grade.score));
        continue;
      }

      scoresBySubject.set(grade.subjectId, [this.decimalToNumber(grade.score)]);
    }

    let failedSubjectsCount = 0;

    for (const subjectScores of scoresBySubject.values()) {
      const subjectTotal = subjectScores.reduce((accumulator, score) => accumulator + score, 0);
      const subjectAverage = subjectTotal / subjectScores.length;

      if (subjectAverage < AVERAGE_GRADE_THRESHOLD) {
        failedSubjectsCount += 1;
      }
    }

    const attendanceIrregular = attendanceIncidents >= ATTENDANCE_INCIDENTS_THRESHOLD;
    const lowAcademicPerformance =
      averageGrade < AVERAGE_GRADE_THRESHOLD ||
      failedSubjectsCount >= FAILED_SUBJECTS_THRESHOLD;
    const relevantFollowUps = followUpsCount >= RELEVANT_FOLLOW_UPS_THRESHOLD;

    const indicators = {
      attendanceIrregular,
      lowAcademicPerformance,
      relevantFollowUps,
    };

    const details = {
      absencesCount,
      delaysCount,
      averageGrade,
      failedSubjectsCount,
      followUpsCount,
    };

    const activeIndicatorsCount = Object.values(indicators).filter(Boolean).length;
    const riskLevel = this.resolveRiskLevel(activeIndicatorsCount);

    const attendanceTotal =
      attendanceCountMap[AttendanceStatus.PRESENTE] +
      attendanceCountMap[AttendanceStatus.FALTA] +
      attendanceCountMap[AttendanceStatus.ATRASO] +
      attendanceCountMap[AttendanceStatus.JUSTIFICADO];

    const attendanceRate =
      attendanceTotal === 0
        ? 0
        : this.roundTo2((attendanceCountMap[AttendanceStatus.PRESENTE] / attendanceTotal) * 100);

    await this.prisma.riskEvaluation.create({
      data: {
        studentId,
        schoolYearId,
        riskLevel: this.toPrismaRiskLevel(riskLevel),
        riskScore: activeIndicatorsCount,
        attendanceRate,
        averageGrade,
        totalAbsences: absencesCount,
        indicators: {
          ...indicators,
          ...details,
          riskLevelLabel: riskLevel,
        },
      },
    });

    return {
      studentId,
      riskLevel,
      indicators,
      details,
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

  private async getActiveSchoolYearId(): Promise<string> {
    const activeSchoolYear = await this.prisma.schoolYear.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: [{ startDate: "desc" }],
    });

    if (!activeSchoolYear) {
      throw new NotFoundException(
        "No existe una gestion escolar activa para registrar evaluaciones de riesgo.",
      );
    }

    return activeSchoolYear.id;
  }

  private buildAttendanceCountMap(
    attendanceRecords: Array<{
      status: AttendanceStatus;
    }>,
  ): Record<AttendanceStatus, number> {
    const initialMap: Record<AttendanceStatus, number> = {
      [AttendanceStatus.PRESENTE]: 0,
      [AttendanceStatus.FALTA]: 0,
      [AttendanceStatus.ATRASO]: 0,
      [AttendanceStatus.JUSTIFICADO]: 0,
    };

    for (const record of attendanceRecords) {
      initialMap[record.status] += 1;
    }

    return initialMap;
  }

  private resolveRiskLevel(activeIndicatorsCount: number): RiskLevelLabel {
    if (activeIndicatorsCount === 3) {
      return RiskLevelLabel.ALTO;
    }

    if (activeIndicatorsCount === 2) {
      return RiskLevelLabel.MEDIO;
    }

    if (activeIndicatorsCount === 1) {
      return RiskLevelLabel.BAJO;
    }

    return RiskLevelLabel.SIN_RIESGO;
  }

  private toPrismaRiskLevel(riskLevel: RiskLevelLabel): RiskLevel {
    if (riskLevel === RiskLevelLabel.ALTO) {
      return RiskLevel.HIGH;
    }

    if (riskLevel === RiskLevelLabel.MEDIO) {
      return RiskLevel.MEDIUM;
    }

    if (riskLevel === RiskLevelLabel.BAJO) {
      return RiskLevel.LOW;
    }

    return RiskLevel.NO_RISK;
  }

  private subDays(baseDate: Date, days: number): Date {
    return new Date(baseDate.getTime() - days * 24 * 60 * 60 * 1000);
  }

  private roundTo2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private decimalToNumber(value: Prisma.Decimal): number {
    return Number(value);
  }
}
