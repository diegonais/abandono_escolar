import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
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
import { CreateEnrollmentDto } from "./dto/create-enrollment.dto";
import {
  EnrollmentResponseDto,
  PaginatedEnrollmentsResponseDto,
} from "./dto/enrollment-response.dto";
import { ListEnrollmentsQueryDto } from "./dto/list-enrollments-query.dto";
import { UpdateEnrollmentStatusDto } from "./dto/update-enrollment-status.dto";
import { EnrollmentsService } from "./enrollments.service";

@ApiTags("enrollments")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("enrollments")
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Inscribir estudiante a curso y gestion (ADMIN)" })
  @ApiCreatedResponse({ type: EnrollmentResponseDto })
  @ApiBadRequestResponse({
    description: "Datos invalidos o relaciones inexistentes para la inscripcion.",
  })
  @ApiConflictResponse({ description: "Inscripcion duplicada para estudiante, curso y gestion." })
  create(@Body() createEnrollmentDto: CreateEnrollmentDto): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.create(createEnrollmentDto);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar inscripciones" })
  @ApiOkResponse({ type: PaginatedEnrollmentsResponseDto })
  findAll(
    @Query() query: ListEnrollmentsQueryDto,
  ): Promise<PaginatedEnrollmentsResponseDto> {
    return this.enrollmentsService.findAll(query);
  }

  @Get("by-course/:courseId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar inscripciones por curso" })
  @ApiOkResponse({ type: PaginatedEnrollmentsResponseDto })
  @ApiBadRequestResponse({ description: "ID de curso invalido." })
  @ApiNotFoundResponse({ description: "Curso no encontrado." })
  findByCourse(
    @Param("courseId", new ParseUUIDPipe()) courseId: string,
    @Query() query: ListEnrollmentsQueryDto,
  ): Promise<PaginatedEnrollmentsResponseDto> {
    return this.enrollmentsService.findByCourse(courseId, query);
  }

  @Get("by-student/:studentId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar inscripciones por estudiante" })
  @ApiOkResponse({ type: PaginatedEnrollmentsResponseDto })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  findByStudent(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
    @Query() query: ListEnrollmentsQueryDto,
  ): Promise<PaginatedEnrollmentsResponseDto> {
    return this.enrollmentsService.findByStudent(studentId, query);
  }

  @Patch(":id/status")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Actualizar estado de inscripcion (ADMIN)" })
  @ApiOkResponse({ type: EnrollmentResponseDto })
  @ApiBadRequestResponse({ description: "ID invalido o estado invalido." })
  @ApiNotFoundResponse({ description: "Inscripcion no encontrada." })
  updateStatus(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateEnrollmentStatusDto: UpdateEnrollmentStatusDto,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.updateStatus(id, updateEnrollmentStatusDto);
  }
}
