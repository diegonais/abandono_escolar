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
import { CoursesService } from "./courses.service";
import { CreateCourseDto } from "./dto/create-course.dto";
import { CourseResponseDto, PaginatedCoursesResponseDto } from "./dto/course-response.dto";
import { ListCoursesQueryDto } from "./dto/list-courses-query.dto";
import { UpdateCourseDto } from "./dto/update-course.dto";

@ApiTags("courses")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("courses")
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar cursos" })
  @ApiOkResponse({ type: PaginatedCoursesResponseDto })
  findAll(@Query() query: ListCoursesQueryDto): Promise<PaginatedCoursesResponseDto> {
    return this.coursesService.findAll(query);
  }

  @Get(":id")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR)
  @ApiOperation({ summary: "Obtener un curso por ID" })
  @ApiOkResponse({ type: CourseResponseDto })
  @ApiBadRequestResponse({ description: "ID de curso invalido." })
  @ApiNotFoundResponse({ description: "Curso no encontrado." })
  findOne(@Param("id", new ParseUUIDPipe()) id: string): Promise<CourseResponseDto> {
    return this.coursesService.findOne(id);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Crear curso (ADMIN)" })
  @ApiCreatedResponse({ type: CourseResponseDto })
  @ApiBadRequestResponse({ description: "Datos invalidos o gestion escolar inexistente." })
  @ApiConflictResponse({
    description: "Ya existe un curso con ese nivel, paralelo y gestion escolar.",
  })
  create(@Body() createCourseDto: CreateCourseDto): Promise<CourseResponseDto> {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(":id")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Actualizar curso (ADMIN)" })
  @ApiOkResponse({ type: CourseResponseDto })
  @ApiBadRequestResponse({
    description: "ID invalido, datos invalidos o gestion escolar inexistente.",
  })
  @ApiNotFoundResponse({ description: "Curso no encontrado." })
  @ApiConflictResponse({
    description: "Ya existe un curso con ese nivel, paralelo y gestion escolar.",
  })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(":id")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Eliminar curso (ADMIN)" })
  @ApiOkResponse({ type: CourseResponseDto })
  @ApiBadRequestResponse({ description: "ID de curso invalido." })
  @ApiNotFoundResponse({ description: "Curso no encontrado." })
  @ApiConflictResponse({
    description: "No se puede eliminar el curso porque tiene registros relacionados.",
  })
  remove(@Param("id", new ParseUUIDPipe()) id: string): Promise<CourseResponseDto> {
    return this.coursesService.remove(id);
  }
}
