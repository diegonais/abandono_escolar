import { ApiProperty } from "@nestjs/swagger";
import { EnrollmentStatus } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum } from "class-validator";

export class UpdateEnrollmentStatusDto {
  @ApiProperty({
    enum: EnrollmentStatus,
    example: EnrollmentStatus.INACTIVE,
    description: "Nuevo estado de la inscripcion",
  })
  @Transform(({ value }) => (typeof value === "string" ? value.toUpperCase() : value))
  @IsEnum(EnrollmentStatus)
  status!: EnrollmentStatus;
}
