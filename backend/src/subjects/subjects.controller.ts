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
import { CreateSubjectDto } from "./dto/create-subject.dto";
import { ListSubjectsQueryDto } from "./dto/list-subjects-query.dto";
import {
  PaginatedSubjectsResponseDto,
  SubjectResponseDto,
} from "./dto/subject-response.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";
import { SubjectsService } from "./subjects.service";

@ApiTags("subjects")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("subjects")
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar materias" })
  @ApiOkResponse({ type: PaginatedSubjectsResponseDto })
  findAll(@Query() query: ListSubjectsQueryDto): Promise<PaginatedSubjectsResponseDto> {
    return this.subjectsService.findAll(query);
  }

  @Get(":id")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR)
  @ApiOperation({ summary: "Obtener una materia por ID" })
  @ApiOkResponse({ type: SubjectResponseDto })
  @ApiBadRequestResponse({ description: "ID de materia invalido." })
  @ApiNotFoundResponse({ description: "Materia no encontrada." })
  findOne(@Param("id", new ParseUUIDPipe()) id: string): Promise<SubjectResponseDto> {
    return this.subjectsService.findOne(id);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Crear materia (ADMIN)" })
  @ApiCreatedResponse({ type: SubjectResponseDto })
  @ApiBadRequestResponse({ description: "Datos invalidos para crear la materia." })
  @ApiConflictResponse({
    description: "Ya existe una materia con ese nombre o codigo.",
  })
  create(@Body() createSubjectDto: CreateSubjectDto): Promise<SubjectResponseDto> {
    return this.subjectsService.create(createSubjectDto);
  }

  @Patch(":id")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Actualizar materia (ADMIN)" })
  @ApiOkResponse({ type: SubjectResponseDto })
  @ApiBadRequestResponse({ description: "ID invalido o datos invalidos para actualizar." })
  @ApiNotFoundResponse({ description: "Materia no encontrada." })
  @ApiConflictResponse({
    description: "Ya existe una materia con ese nombre o codigo.",
  })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ): Promise<SubjectResponseDto> {
    return this.subjectsService.update(id, updateSubjectDto);
  }

  @Patch(":id/deactivate")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Desactivar materia (ADMIN)" })
  @ApiOkResponse({ type: SubjectResponseDto })
  @ApiBadRequestResponse({ description: "ID de materia invalido." })
  @ApiNotFoundResponse({ description: "Materia no encontrada." })
  deactivate(@Param("id", new ParseUUIDPipe()) id: string): Promise<SubjectResponseDto> {
    return this.subjectsService.deactivate(id);
  }
}
