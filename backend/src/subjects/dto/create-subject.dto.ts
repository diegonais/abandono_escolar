import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateSubjectDto {
  @ApiProperty({
    example: "Matematica",
    description: "Nombre unico de la materia",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({
    example: "MAT",
    description: "Codigo opcional de la materia",
  })
  @Transform(({ value }) =>
    typeof value === "string" && value.length > 0 ? value.trim().toUpperCase() : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  @Matches(/^[A-Z0-9_-]+$/, {
    message: "El codigo solo puede contener letras mayusculas, numeros, guiones y guion bajo.",
  })
  code?: string;

  @ApiPropertyOptional({
    example: true,
    description: "Indica si la materia esta activa",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
