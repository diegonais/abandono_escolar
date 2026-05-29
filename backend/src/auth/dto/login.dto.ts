import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "admin@abandono.test",
    description: "Correo del usuario",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "Admin123456",
    description: "Contrasena del usuario",
  })
  @IsString()
  @MinLength(6)
  password!: string;
}
