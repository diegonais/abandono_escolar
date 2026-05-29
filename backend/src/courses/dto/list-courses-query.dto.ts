import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class ListCoursesQueryDto {
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
    example: "a8ad2ea8-69c8-4b95-aa81-c0a775acbb77",
    description: "Filtrar por ID de gestion escolar",
    format: "uuid",
  })
  @IsUUID()
  @IsOptional()
  schoolYearId?: string;
}
