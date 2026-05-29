import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
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
import { AttendanceService } from "./attendance.service";
import {
  AttendanceResponseDto,
  AttendanceSummaryResponseDto,
} from "./dto/attendance-response.dto";
import { AttendanceSummaryQueryDto } from "./dto/attendance-summary-query.dto";
import { CreateAttendanceDto } from "./dto/create-attendance.dto";
import { ListAttendanceQueryDto } from "./dto/list-attendance-query.dto";
import { UpdateAttendanceDto } from "./dto/update-attendance.dto";

@ApiTags("attendance")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.DOCENTE)
  @ApiOperation({ summary: "Registrar asistencia (ADMIN, DOCENTE)" })
  @ApiCreatedResponse({ type: AttendanceResponseDto })
  @ApiBadRequestResponse({
    description: "Datos invalidos, fecha futura o relaciones inexistentes.",
  })
  @ApiConflictResponse({ description: "Asistencia duplicada para estudiante, curso y fecha." })
  create(@Body() createAttendanceDto: CreateAttendanceDto): Promise<AttendanceResponseDto> {
    return this.attendanceService.create(createAttendanceDto);
  }

  @Post("bulk")
  @Roles(RoleName.ADMIN, RoleName.DOCENTE)
  @ApiOperation({ summary: "Registrar asistencias en lote (ADMIN, DOCENTE)" })
  @ApiBody({ type: [CreateAttendanceDto] })
  @ApiCreatedResponse({ type: [AttendanceResponseDto] })
  @ApiBadRequestResponse({
    description: "Datos invalidos, fecha futura o relaciones inexistentes.",
  })
  @ApiConflictResponse({
    description:
      "Registros duplicados en el lote o asistencias ya existentes para estudiante, curso y fecha.",
  })
  createBulk(
    @Body(new ParseArrayPipe({ items: CreateAttendanceDto }))
    createAttendanceDtos: CreateAttendanceDto[],
  ): Promise<AttendanceResponseDto[]> {
    return this.attendanceService.createBulk(createAttendanceDtos);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar asistencias con filtros" })
  @ApiOkResponse({ type: [AttendanceResponseDto] })
  findAll(@Query() query: ListAttendanceQueryDto): Promise<AttendanceResponseDto[]> {
    return this.attendanceService.findAll(query);
  }

  @Get("summary/student/:studentId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Resumen de asistencia por estudiante" })
  @ApiOkResponse({ type: AttendanceSummaryResponseDto })
  @ApiBadRequestResponse({ description: "ID invalido o rango de fechas invalido." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  getStudentSummary(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
    @Query() query: AttendanceSummaryQueryDto,
  ): Promise<AttendanceSummaryResponseDto> {
    return this.attendanceService.getStudentSummary(studentId, query);
  }

  @Get("by-student/:studentId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar asistencias por estudiante" })
  @ApiOkResponse({ type: [AttendanceResponseDto] })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido o filtros invalidos." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  findByStudent(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
    @Query() query: ListAttendanceQueryDto,
  ): Promise<AttendanceResponseDto[]> {
    return this.attendanceService.findByStudent(studentId, query);
  }

  @Get("by-course/:courseId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar asistencias por curso" })
  @ApiOkResponse({ type: [AttendanceResponseDto] })
  @ApiBadRequestResponse({ description: "ID de curso invalido o filtros invalidos." })
  @ApiNotFoundResponse({ description: "Curso no encontrado." })
  findByCourse(
    @Param("courseId", new ParseUUIDPipe()) courseId: string,
    @Query() query: ListAttendanceQueryDto,
  ): Promise<AttendanceResponseDto[]> {
    return this.attendanceService.findByCourse(courseId, query);
  }

  @Patch(":id")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Corregir asistencia (ADMIN)" })
  @ApiOkResponse({ type: AttendanceResponseDto })
  @ApiBadRequestResponse({
    description: "ID invalido, datos invalidos, fecha futura o relaciones inexistentes.",
  })
  @ApiNotFoundResponse({ description: "Asistencia no encontrada." })
  @ApiConflictResponse({ description: "Asistencia duplicada para estudiante, curso y fecha." })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateAttendanceDto: UpdateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.update(id, updateAttendanceDto);
  }
}
