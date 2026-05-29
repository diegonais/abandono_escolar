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
import { CreateStudentDto } from "./dto/create-student.dto";
import { ListStudentsQueryDto } from "./dto/list-students-query.dto";
import {
  PaginatedStudentsResponseDto,
  StudentResponseDto,
} from "./dto/student-response.dto";
import { UpdateStudentDto } from "./dto/update-student.dto";
import { StudentsService } from "./students.service";

@ApiTags("students")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("students")
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar estudiantes" })
  @ApiOkResponse({ type: PaginatedStudentsResponseDto })
  findAll(@Query() query: ListStudentsQueryDto): Promise<PaginatedStudentsResponseDto> {
    return this.studentsService.findAll(query);
  }

  @Get(":id")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Obtener un estudiante por ID" })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  findOne(@Param("id", new ParseUUIDPipe()) id: string): Promise<StudentResponseDto> {
    return this.studentsService.findOne(id);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Crear estudiante (ADMIN)" })
  @ApiCreatedResponse({ type: StudentResponseDto })
  @ApiBadRequestResponse({ description: "Datos invalidos para crear el estudiante." })
  @ApiConflictResponse({ description: "Ya existe un estudiante con ese CI." })
  create(@Body() createStudentDto: CreateStudentDto): Promise<StudentResponseDto> {
    return this.studentsService.create(createStudentDto);
  }

  @Patch(":id")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Actualizar estudiante (ADMIN)" })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiBadRequestResponse({ description: "ID invalido o datos invalidos para actualizar." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  @ApiConflictResponse({ description: "Ya existe un estudiante con ese CI." })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ): Promise<StudentResponseDto> {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Patch(":id/deactivate")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Desactivar estudiante (ADMIN)" })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  deactivate(@Param("id", new ParseUUIDPipe()) id: string): Promise<StudentResponseDto> {
    return this.studentsService.deactivate(id);
  }

  @Patch(":id/activate")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Activar estudiante (ADMIN)" })
  @ApiOkResponse({ type: StudentResponseDto })
  @ApiBadRequestResponse({ description: "ID de estudiante invalido." })
  @ApiNotFoundResponse({ description: "Estudiante no encontrado." })
  activate(@Param("id", new ParseUUIDPipe()) id: string): Promise<StudentResponseDto> {
    return this.studentsService.activate(id);
  }
}
