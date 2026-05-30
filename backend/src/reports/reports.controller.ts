import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { RoleName } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import {
  CourseRiskSummaryDto,
  DashboardReportDto,
  StudentFullReportDto,
  StudentsAtRiskItemDto,
} from "./dto/report-response.dto";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("students-at-risk")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({
    summary: "Lista estudiantes con ultimo nivel de riesgo, indicadores activos y estado de alerta",
  })
  @ApiOkResponse({ type: [StudentsAtRiskItemDto] })
  getStudentsAtRisk(): Promise<StudentsAtRiskItemDto[]> {
    return this.reportsService.getStudentsAtRisk();
  }

  @Get("course/:courseId/risk-summary")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Resumen de riesgo por curso" })
  @ApiOkResponse({ type: CourseRiskSummaryDto })
  @ApiBadRequestResponse({ description: "ID de curso invalido." })
  @ApiNotFoundResponse({ description: "Curso no encontrado." })
  getCourseRiskSummary(
    @Param("courseId", new ParseUUIDPipe()) courseId: string,
  ): Promise<CourseRiskSummaryDto> {
    return this.reportsService.getCourseRiskSummary(courseId);
  }

  @Get("student/:studentId/full")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Reporte completo de un estudiante" })
  @ApiOkResponse({ type: StudentFullReportDto })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  getStudentFullReport(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
  ): Promise<StudentFullReportDto> {
    return this.reportsService.getStudentFullReport(studentId);
  }

  @Get("dashboard")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "KPIs principales del dashboard de riesgo" })
  @ApiOkResponse({ type: DashboardReportDto })
  getDashboard(): Promise<DashboardReportDto> {
    return this.reportsService.getDashboardReport();
  }
}
