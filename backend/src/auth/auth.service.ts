import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../prisma/prisma.service";
import { LoginResponseDto } from "./dto/auth-response.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthUser, JwtPayload } from "./types/auth-user.type";

type UserWithRole = Prisma.UserGetPayload<{
  include: { role: true };
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Credenciales invalidas.");
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Credenciales invalidas.");
    }

    return this.buildLoginResponse(user);
  }

  async getAuthenticatedUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Usuario no autorizado.");
    }

    return this.toAuthUser(user);
  }

  private async buildLoginResponse(user: UserWithRole): Promise<LoginResponseDto> {
    const authUser = this.toAuthUser(user);
    const payload: JwtPayload = {
      sub: authUser.id,
      email: authUser.email,
      role: authUser.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: authUser,
    };
  }

  private toAuthUser(user: UserWithRole): AuthUser {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role.name,
    };
  }
}
