import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
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
import { AlertsService } from "./alerts.service";
import {
  AlertBulkGenerationResultDto,
  AlertGenerationResultDto,
  AlertResponseDto,
} from "./dto/alert-response.dto";
import { UpdateAlertStatusDto } from "./dto/update-alert-status.dto";

@ApiTags("alerts")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("alerts")
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar alertas" })
  @ApiOkResponse({ type: [AlertResponseDto] })
  findAll(): Promise<AlertResponseDto[]> {
    return this.alertsService.findAll();
  }

  @Get("by-student/:studentId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar alertas por estudiante" })
  @ApiOkResponse({ type: [AlertResponseDto] })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  findByStudent(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
  ): Promise<AlertResponseDto[]> {
    return this.alertsService.findByStudent(studentId);
  }

  @Get(":id")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Obtener detalle de una alerta" })
  @ApiOkResponse({ type: AlertResponseDto })
  @ApiBadRequestResponse({ description: "ID de alerta invalido." })
  @ApiNotFoundResponse({ description: "Alerta no encontrada." })
  findOne(@Param("id", new ParseUUIDPipe()) id: string): Promise<AlertResponseDto> {
    return this.alertsService.findOne(id);
  }

  @Patch(":id/status")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Actualizar estado de alerta" })
  @ApiOkResponse({ type: AlertResponseDto })
  @ApiBadRequestResponse({ description: "ID de alerta o estado invalido." })
  @ApiNotFoundResponse({ description: "Alerta no encontrada." })
  updateStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateAlertStatusDto: UpdateAlertStatusDto,
  ): Promise<AlertResponseDto> {
    return this.alertsService.updateStatus(id, updateAlertStatusDto);
  }

  @Post("generate/student/:studentId")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Generar alerta preventiva para un estudiante" })
  @ApiOkResponse({ type: AlertGenerationResultDto })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({
    description: "Estudiante no encontrado o no existe gestion escolar activa.",
  })
  generateByStudent(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
  ): Promise<AlertGenerationResultDto> {
    return this.alertsService.generateForStudent(studentId);
  }

  @Post("generate/all")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Generar alertas preventivas para todos los estudiantes activos" })
  @ApiOkResponse({ type: AlertBulkGenerationResultDto })
  @ApiNotFoundResponse({ description: "No existe gestion escolar activa." })
  generateForAll(): Promise<AlertBulkGenerationResultDto> {
    return this.alertsService.generateForAllStudents();
  }
}
