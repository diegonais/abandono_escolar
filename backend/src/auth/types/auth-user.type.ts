import { RoleName } from "@prisma/client";

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: RoleName;
};

export type JwtPayload = {
  sub: string;
  email: string;
  role: RoleName;
};
