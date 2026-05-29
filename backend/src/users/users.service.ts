import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, Role, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { PaginatedUsersResponseDto, UserResponseDto } from "./dto/user-response.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true };
}>;

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListUsersQueryDto): Promise<PaginatedUsersResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.UserWhereInput = {};

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.roleName) {
      where.role = { name: query.roleName };
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: users.map((user) => this.toUserResponse(user)),
      meta: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<UserResponseDto> {
    const user = await this.findUserByIdOrThrow(id);
    return this.toUserResponse(user);
  }

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    await this.ensureEmailIsAvailable(createUserDto.email);
    await this.findRoleByIdOrThrow(createUserDto.roleId);

    const passwordHash = await bcrypt.hash(createUserDto.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        fullName: createUserDto.fullName,
        passwordHash,
        roleId: createUserDto.roleId,
      },
      include: { role: true },
    });

    return this.toUserResponse(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.findUserByIdOrThrow(id);

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      await this.ensureEmailIsAvailable(updateUserDto.email, existingUser.id);
    }

    if (updateUserDto.roleId && updateUserDto.roleId !== existingUser.roleId) {
      await this.findRoleByIdOrThrow(updateUserDto.roleId);
    }

    const updateData: Prisma.UserUpdateInput = {
      ...(updateUserDto.email ? { email: updateUserDto.email } : {}),
      ...(updateUserDto.fullName ? { fullName: updateUserDto.fullName } : {}),
      ...(updateUserDto.roleId ? { role: { connect: { id: updateUserDto.roleId } } } : {}),
    };

    if (updateUserDto.password) {
      updateData.passwordHash = await bcrypt.hash(
        updateUserDto.password,
        SALT_ROUNDS,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });

    return this.toUserResponse(updatedUser);
  }

  async deactivate(id: string): Promise<UserResponseDto> {
    return this.updateUserStatus(id, false);
  }

  async activate(id: string): Promise<UserResponseDto> {
    return this.updateUserStatus(id, true);
  }

  private async updateUserStatus(
    id: string,
    isActive: boolean,
  ): Promise<UserResponseDto> {
    const existingUser = await this.findUserByIdOrThrow(id);

    if (existingUser.isActive === isActive) {
      return this.toUserResponse(existingUser);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive },
      include: { role: true },
    });

    return this.toUserResponse(updatedUser);
  }

  private async ensureEmailIsAvailable(
    email: string,
    excludeUserId?: string,
  ): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== excludeUserId) {
      throw new ConflictException("Ya existe un usuario con ese email.");
    }
  }

  private async findRoleByIdOrThrow(roleId: string): Promise<Role> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new BadRequestException("El rol asignado no existe.");
    }

    return role;
  }

  private async findUserByIdOrThrow(id: string): Promise<UserWithRole> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) {
      throw new NotFoundException("Usuario no encontrado.");
    }

    return user;
  }

  private toUserResponse(user: UserWithRole): UserResponseDto {
    const { passwordHash: _passwordHash, ...safeUser } = user as User & {
      role: UserWithRole["role"];
    };

    return {
      ...safeUser,
      role: {
        id: user.role.id,
        name: user.role.name,
      },
    };
  }
}
