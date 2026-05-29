import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

function toTrimmedOptionalString(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export class CreateStudentDto {
  @ApiProperty({
    example: "Maria",
    description: "Nombre del estudiante",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  firstName!: string;

  @ApiProperty({
    example: "Quispe",
    description: "Apellido del estudiante",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  lastName!: string;

  @ApiPropertyOptional({
    example: "12345678",
    description: "CI del estudiante (opcional)",
  })
  @Transform(({ value }) => {
    if (typeof value !== "string") {
      return value;
    }

    const trimmedValue = value.trim();
    return trimmedValue.length > 0 ? trimmedValue.toUpperCase() : undefined;
  })
  @IsOptional()
  @IsString()
  @MinLength(4)
  @MaxLength(30)
  @Matches(/^[A-Z0-9-]+$/, {
    message: "El CI solo puede contener letras, numeros y guiones.",
  })
  ci?: string;

  @ApiPropertyOptional({
    example: "2010-05-21",
    description: "Fecha de nacimiento en formato ISO",
  })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({
    example: "F",
    description: "Genero del estudiante",
  })
  @Transform(({ value }) => toTrimmedOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(20)
  gender?: string;

  @ApiPropertyOptional({
    example: "Juana Mamani",
    description: "Nombre del tutor o apoderado",
  })
  @Transform(({ value }) => toTrimmedOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(120)
  tutorName?: string;

  @ApiPropertyOptional({
    example: "+59170000000",
    description: "Telefono del tutor o apoderado",
  })
  @Transform(({ value }) => toTrimmedOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(30)
  @Matches(/^[0-9()+\-\s]+$/, {
    message: "El telefono solo puede contener numeros y simbolos telefonicos comunes.",
  })
  tutorPhone?: string;

  @ApiPropertyOptional({
    example: "Zona central, calle 10",
    description: "Direccion del estudiante",
  })
  @Transform(({ value }) => toTrimmedOptionalString(value))
  @IsOptional()
  @IsString()
  @MaxLength(255)
  address?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Indica si el estudiante esta activo",
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}
