import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";
import { AuthUser } from "../types/auth-user.type";

export const CurrentUser = createParamDecorator(
  (data: keyof AuthUser | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthUser | undefined;

    if (!data) {
      return user;
    }

    return user?.[data];
  },
);
