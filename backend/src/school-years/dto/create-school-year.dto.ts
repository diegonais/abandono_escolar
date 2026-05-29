import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreateSchoolYearDto {
  @ApiProperty({
    example: "Gestion 2026",
    description: "Nombre unico de la gestion escolar",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  name!: string;

  @ApiProperty({
    example: "2026-01-15",
    description: "Fecha de inicio en formato ISO (YYYY-MM-DD)",
  })
  @IsDateString()
  startDate!: string;

  @ApiProperty({
    example: "2026-12-15",
    description: "Fecha de cierre en formato ISO (YYYY-MM-DD)",
  })
  @IsDateString()
  endDate!: string;

  @ApiPropertyOptional({
    example: true,
    description: "Indica si la gestion escolar esta activa",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;
}
