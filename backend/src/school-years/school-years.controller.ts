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
import { CreateSchoolYearDto } from "./dto/create-school-year.dto";
import { ListSchoolYearsQueryDto } from "./dto/list-school-years-query.dto";
import {
  PaginatedSchoolYearsResponseDto,
  SchoolYearResponseDto,
} from "./dto/school-year-response.dto";
import { UpdateSchoolYearDto } from "./dto/update-school-year.dto";
import { SchoolYearsService } from "./school-years.service";

@ApiTags("school-years")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "No tienes permisos para este recurso." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("school-years")
export class SchoolYearsController {
  constructor(private readonly schoolYearsService: SchoolYearsService) {}

  @Get()
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR, RoleName.DOCENTE, RoleName.SEGUIMIENTO)
  @ApiOperation({ summary: "Listar gestiones escolares" })
  @ApiOkResponse({ type: PaginatedSchoolYearsResponseDto })
  findAll(
    @Query() query: ListSchoolYearsQueryDto,
  ): Promise<PaginatedSchoolYearsResponseDto> {
    return this.schoolYearsService.findAll(query);
  }

  @Get(":id")
  @Roles(RoleName.ADMIN, RoleName.DIRECTOR)
  @ApiOperation({ summary: "Obtener una gestion escolar por ID" })
  @ApiOkResponse({ type: SchoolYearResponseDto })
  @ApiBadRequestResponse({ description: "ID de gestion escolar invalido." })
  @ApiNotFoundResponse({ description: "Gestion escolar no encontrada." })
  findOne(@Param("id", new ParseUUIDPipe()) id: string): Promise<SchoolYearResponseDto> {
    return this.schoolYearsService.findOne(id);
  }

  @Post()
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Crear gestion escolar (ADMIN)" })
  @ApiCreatedResponse({ type: SchoolYearResponseDto })
  @ApiBadRequestResponse({ description: "Datos invalidos para crear la gestion escolar." })
  @ApiConflictResponse({ description: "Ya existe una gestion escolar con ese nombre." })
  create(@Body() createSchoolYearDto: CreateSchoolYearDto): Promise<SchoolYearResponseDto> {
    return this.schoolYearsService.create(createSchoolYearDto);
  }

  @Patch(":id")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Actualizar gestion escolar (ADMIN)" })
  @ApiOkResponse({ type: SchoolYearResponseDto })
  @ApiBadRequestResponse({
    description: "ID invalido o datos invalidos para actualizar la gestion escolar.",
  })
  @ApiNotFoundResponse({ description: "Gestion escolar no encontrada." })
  @ApiConflictResponse({ description: "Ya existe una gestion escolar con ese nombre." })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateSchoolYearDto: UpdateSchoolYearDto,
  ): Promise<SchoolYearResponseDto> {
    return this.schoolYearsService.update(id, updateSchoolYearDto);
  }

  @Patch(":id/deactivate")
  @Roles(RoleName.ADMIN)
  @ApiOperation({ summary: "Desactivar gestion escolar (ADMIN)" })
  @ApiOkResponse({ type: SchoolYearResponseDto })
  @ApiBadRequestResponse({ description: "ID de gestion escolar invalido." })
  @ApiNotFoundResponse({ description: "Gestion escolar no encontrada." })
  deactivate(@Param("id", new ParseUUIDPipe()) id: string): Promise<SchoolYearResponseDto> {
    return this.schoolYearsService.deactivate(id);
  }
}
