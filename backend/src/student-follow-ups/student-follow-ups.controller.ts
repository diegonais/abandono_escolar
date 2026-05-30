import {
  Body,
  Controller,
  Delete,
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
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { RoleName } from "@prisma/client";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthUser } from "../auth/types/auth-user.type";
import { CreateStudentFollowUpDto } from "./dto/create-student-follow-up.dto";
import { ListStudentFollowUpsQueryDto } from "./dto/list-student-follow-ups-query.dto";
import {
  StudentFollowUpResponseDto,
  StudentFollowUpsSummaryResponseDto,
} from "./dto/student-follow-up-response.dto";
import { UpdateStudentFollowUpDto } from "./dto/update-student-follow-up.dto";
import { StudentFollowUpsService } from "./student-follow-ups.service";

@ApiTags("student-follow-ups")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("student-follow-ups")
export class StudentFollowUpsController {
  constructor(private readonly studentFollowUpsService: StudentFollowUpsService) {}

  @Post()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.SEGUIMIENTO, RoleName.DOCENTE)
  @ApiOperation({
    summary:
      "Registrar seguimiento estudiantil (ADMIN, DIRECTOR, SEGUIMIENTO; DOCENTE solo ACADEMICO/CONDUCTUAL)",
  })
  @ApiCreatedResponse({ type: StudentFollowUpResponseDto })
  @ApiBadRequestResponse({ description: "Datos invalidos o estudiante inexistente." })
  create(
    @Body() createStudentFollowUpDto: CreateStudentFollowUpDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<StudentFollowUpResponseDto> {
    return this.studentFollowUpsService.create(createStudentFollowUpDto, authUser);
  }

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.SEGUIMIENTO, RoleName.DOCENTE)
  @ApiOperation({ summary: "Listar seguimientos estudiantiles con filtros" })
  @ApiOkResponse({ type: [StudentFollowUpResponseDto] })
  findAll(
    @Query() query: ListStudentFollowUpsQueryDto,
  ): Promise<StudentFollowUpResponseDto[]> {
    return this.studentFollowUpsService.findAll(query);
  }

  @Get("summary/student/:studentId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.SEGUIMIENTO, RoleName.DOCENTE)
  @ApiOperation({ summary: "Resumen de seguimientos por estudiante" })
  @ApiOkResponse({ type: StudentFollowUpsSummaryResponseDto })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  getStudentSummary(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
  ): Promise<StudentFollowUpsSummaryResponseDto> {
    return this.studentFollowUpsService.getStudentSummary(studentId);
  }

  @Get("by-student/:studentId")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.SEGUIMIENTO, RoleName.DOCENTE)
  @ApiOperation({ summary: "Listar seguimientos por estudiante" })
  @ApiOkResponse({ type: [StudentFollowUpResponseDto] })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido o filtros invalidos." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  findByStudent(
    @Param("studentId", new ParseUUIDPipe()) studentId: string,
    @Query() query: ListStudentFollowUpsQueryDto,
  ): Promise<StudentFollowUpResponseDto[]> {
    return this.studentFollowUpsService.findByStudent(studentId, query);
  }

  @Patch(":id")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.SEGUIMIENTO, RoleName.DOCENTE)
  @ApiOperation({
    summary:
      "Actualizar seguimiento (ADMIN, DIRECTOR, SEGUIMIENTO; DOCENTE solo ACADEMICO/CONDUCTUAL)",
  })
  @ApiOkResponse({ type: StudentFollowUpResponseDto })
  @ApiBadRequestResponse({ description: "ID invalido, datos invalidos o estudiante inexistente." })
  @ApiNotFoundResponse({ description: "Seguimiento no encontrado." })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateStudentFollowUpDto: UpdateStudentFollowUpDto,
    @CurrentUser() authUser: AuthUser,
  ): Promise<StudentFollowUpResponseDto> {
    return this.studentFollowUpsService.update(id, updateStudentFollowUpDto, authUser);
  }

  @Delete(":id")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.SEGUIMIENTO, RoleName.DOCENTE)
  @ApiOperation({ summary: "Eliminar seguimiento estudiantil" })
  @ApiOkResponse({ type: StudentFollowUpResponseDto })
  @ApiBadRequestResponse({ description: "ID de seguimiento invalido." })
  @ApiNotFoundResponse({ description: "Seguimiento no encontrado." })
  remove(@Param("id", new ParseUUIDPipe()) id: string): Promise<StudentFollowUpResponseDto> {
    return this.studentFollowUpsService.remove(id);
  }
}
