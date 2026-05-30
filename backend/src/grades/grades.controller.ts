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
import { CreateGradeDto } from "./dto/create-grade.dto";
import {
  GradeResponseDto,
  GradeStudentSummaryResponseDto,
} from "./dto/grade-response.dto";
import { ListGradesQueryDto } from "./dto/list-grades-query.dto";
import { UpdateGradeDto } from "./dto/update-grade.dto";
import { GradesService } from "./grades.service";

@ApiTags("grades")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("grades")
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.DOCENTE)
  @ApiOperation({ summary: "Registrar calificacion (ADMIN, DOCENTE)" })
  @ApiCreatedResponse({ type: GradeResponseDto })
  @ApiBadRequestResponse({ description: "Datos invalidos o relaciones inexistentes." })
  @ApiConflictResponse({
    description:
      "Ya existe una calificacion para studentId + subjectId + courseId + period.",
  })
  create(@Body() createGradeDto: CreateGradeDto): Promise<GradeResponseDto> {
    return this.gradesService.create(createGradeDto);
  }

  @Post("bulk")
  @Roles(RoleName.ADMIN, RoleName.DOCENTE)
  @ApiOperation({ summary: "Registrar calificaciones en lote (ADMIN, DOCENTE)" })
  @ApiBody({ type: [CreateGradeDto] })
  @ApiCreatedResponse({ type: [GradeResponseDto] })
  @ApiBadRequestResponse({ description: "Datos invalidos o relaciones inexistentes." })
  @ApiConflictResponse({
    description:
      "Registros duplicados en el lote o calificaciones ya existentes para studentId + subjectId + courseId + period.",
  })
  createBulk(
    @Body(new ParseArrayPipe({ items: CreateGradeDto }))
    createGradeDtos: CreateGradeDto[],
  ): Promise<GradeResponseDto[]> {
    return this.gradesService.createBulk(createGradeDtos);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar calificaciones con filtros" })
  @ApiOkResponse({ type: [GradeResponseDto] })
  findAll(@Query() query: ListGradesQueryDto): Promise<GradeResponseDto[]> {
    return this.gradesService.findAll(query);
  }

  @Get("summary/student/:studentId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Resumen academico de calificaciones por estudiante" })
  @ApiOkResponse({ type: GradeStudentSummaryResponseDto })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  getStudentSummary(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
  ): Promise<GradeStudentSummaryResponseDto> {
    return this.gradesService.getStudentSummary(studentId);
  }

  @Get("by-student/:studentId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar calificaciones por estudiante" })
  @ApiOkResponse({ type: [GradeResponseDto] })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido o filtros invalidos." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  findByStudent(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
    @Query() query: ListGradesQueryDto,
  ): Promise<GradeResponseDto[]> {
    return this.gradesService.findByStudent(studentId, query);
  }

  @Get("by-course/:courseId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar calificaciones por curso" })
  @ApiOkResponse({ type: [GradeResponseDto] })
  @ApiBadRequestResponse({ description: "ID de curso invalido o filtros invalidos." })
  @ApiNotFoundResponse({ description: "Curso no encontrado." })
  findByCourse(
    @Param("courseId", new ParseUUIDPipe()) courseId: string,
    @Query() query: ListGradesQueryDto,
  ): Promise<GradeResponseDto[]> {
    return this.gradesService.findByCourse(courseId, query);
  }

  @Patch(":id")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Corregir calificacion (ADMIN)" })
  @ApiOkResponse({ type: GradeResponseDto })
  @ApiBadRequestResponse({
    description: "ID invalido, datos invalidos o relaciones inexistentes.",
  })
  @ApiNotFoundResponse({ description: "Calificacion no encontrada." })
  @ApiConflictResponse({
    description:
      "Ya existe una calificacion para studentId + subjectId + courseId + period.",
  })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateGradeDto: UpdateGradeDto,
  ): Promise<GradeResponseDto> {
    return this.gradesService.update(id, updateGradeDto);
  }
}
