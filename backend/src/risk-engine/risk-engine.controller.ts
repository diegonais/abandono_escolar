import { Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
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
import { RiskEvaluationResponseDto } from "./dto/risk-evaluation-response.dto";
import { RiskEngineService } from "./risk-engine.service";

@ApiTags("risk")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("risk")
export class RiskEngineController {
  constructor(private readonly riskEngineService: RiskEngineService) {}

  @Get("student/:studentId/evaluate")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Evaluar riesgo de abandono para un estudiante" })
  @ApiOkResponse({ type: RiskEvaluationResponseDto })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({
    description: "Estudiante no encontrado o gestion escolar activa inexistente.",
  })
  evaluateStudentRisk(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
  ): Promise<RiskEvaluationResponseDto> {
    return this.riskEngineService.evaluateStudentRisk(studentId);
  }

  @Post("evaluate-all")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Evaluar riesgo de abandono para todos los estudiantes activos" })
  @ApiOkResponse({ type: [RiskEvaluationResponseDto] })
  @ApiNotFoundResponse({ description: "No existe gestion escolar activa." })
  evaluateAllStudentsRisk(): Promise<RiskEvaluationResponseDto[]> {
    return this.riskEngineService.evaluateAllStudents();
  }
}
