import { ApiProperty } from "@nestjs/swagger";
import { RoleName } from "@prisma/client";

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  fullName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: RoleName })
  role!: RoleName;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty({ type: AuthUserDto })
  user!: AuthUserDto;
}
