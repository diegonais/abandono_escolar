import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RoleName } from "@prisma/client";
import { Request } from "express";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { AuthUser } from "../types/auth-user.type";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;

    if (!user) {
      throw new ForbiddenException("No se encontro usuario autenticado.");
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException(
        "No tienes permisos para acceder a este recurso.",
      );
    }

    return true;
  }
}
