import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateUserDto {
  @ApiProperty({
    example: "usuario@abandono.test",
    description: "Correo unico del usuario",
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "Usuario de Prueba",
    description: "Nombre completo del usuario",
  })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  fullName!: string;

  @ApiProperty({
    example: "Password123",
    description: "Contrasena del usuario",
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  @MaxLength(100)
  password!: string;

  @ApiProperty({
    example: "a8ad2ea8-69c8-4b95-aa81-c0a775acbb77",
    description: "ID del rol existente a asignar",
    format: "uuid",
  })
  @IsUUID()
  roleId!: string;
}
