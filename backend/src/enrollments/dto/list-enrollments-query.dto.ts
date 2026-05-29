import { ApiPropertyOptional } from "@nestjs/swagger";
import { EnrollmentStatus } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class ListEnrollmentsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: "Pagina solicitada",
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: "Cantidad de registros por pagina",
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: EnrollmentStatus,
    description: "Filtrar por estado de inscripcion",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(EnrollmentStatus)
  @IsOptional()
  status?: EnrollmentStatus;

  @ApiPropertyOptional({
    example: "0f53f47d-cfae-45d8-bd18-7aed3784f184",
    description: "Filtrar por ID de gestion escolar",
    format: "uuid",
  })
  @IsUUID()
  @IsOptional()
  schoolYearId?: string;
}
