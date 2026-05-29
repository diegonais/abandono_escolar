import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateCourseDto {
  @ApiProperty({
    example: "1ro Secundaria",
    description: "Nivel del curso",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  level!: string;

  @ApiProperty({
    example: "A",
    description: "Paralelo del curso",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  parallel!: string;

  @ApiProperty({
    example: "a8ad2ea8-69c8-4b95-aa81-c0a775acbb77",
    description: "ID de la gestion escolar asociada",
    format: "uuid",
  })
  @IsUUID()
  schoolYearId!: string;
}
