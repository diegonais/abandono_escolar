import { ApiProperty } from "@nestjs/swagger";
import { RoleName } from "@prisma/client";

export class UserRoleDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: RoleName })
  name!: RoleName;
}

export class UserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  roleId!: string;

  @ApiProperty({ type: UserRoleDto })
  role!: UserRoleDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class UsersPaginationMetaDto {
  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  totalPages!: number;
}

export class PaginatedUsersResponseDto {
  @ApiProperty({ type: [UserResponseDto] })
  data!: UserResponseDto[];

  @ApiProperty({ type: UsersPaginationMetaDto })
  meta!: UsersPaginationMetaDto;
}
