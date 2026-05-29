import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
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
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { PaginatedUsersResponseDto, UserResponseDto } from "./dto/user-response.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UsersService } from "./users.service";

@ApiTags("users")
@ApiBearerAuth("bearer")
@ApiUnauthorizedResponse({ description: "Token invalido o ausente." })
@ApiForbiddenResponse({ description: "Requiere rol ADMIN." })
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.ADMIN)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Listar usuarios (ADMIN)" })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  findAll(@Query() query: ListUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Obtener un usuario por ID (ADMIN)" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: "ID de usuario invalido." })
  @ApiNotFoundResponse({ description: "Usuario no encontrado." })
  findOne(@Param("id", new ParseUUIDPipe()) id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Crear usuario (ADMIN)" })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: "Datos invalidos o rol inexistente." })
  @ApiConflictResponse({ description: "El email ya existe." })
  create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.create(createUserDto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar usuario (ADMIN)" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({
    description: "ID invalido, datos invalidos o rol inexistente.",
  })
  @ApiConflictResponse({ description: "El email ya existe." })
  @ApiNotFoundResponse({ description: "Usuario no encontrado." })
  update(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(":id/deactivate")
  @ApiOperation({ summary: "Desactivar usuario (ADMIN)" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: "ID de usuario invalido." })
  @ApiNotFoundResponse({ description: "Usuario no encontrado." })
  deactivate(@Param("id", new ParseUUIDPipe()) id: string): Promise<UserResponseDto> {
    return this.usersService.deactivate(id);
  }

  @Patch(":id/activate")
  @ApiOperation({ summary: "Activar usuario (ADMIN)" })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ description: "ID de usuario invalido." })
  @ApiNotFoundResponse({ description: "Usuario no encontrado." })
  activate(@Param("id", new ParseUUIDPipe()) id: string): Promise<UserResponseDto> {
    return this.usersService.activate(id);
  }
}
