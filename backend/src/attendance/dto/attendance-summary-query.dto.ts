import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsDateString, IsOptional } from "class-validator";

export class AttendanceSummaryQueryDto {
  @ApiPropertyOptional({
    example: "2026-05-01",
    description: "Fecha inicial del resumen (inclusive)",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({
    example: "2026-05-31",
    description: "Fecha final del resumen (inclusive)",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
