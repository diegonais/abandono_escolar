import { Module } from "@nestjs/common";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { SchoolYearsController } from "./school-years.controller";
import { SchoolYearsService } from "./school-years.service";

@Module({
  imports: [PrismaModule],
  controllers: [SchoolYearsController],
  providers: [SchoolYearsService, RolesGuard],
})
export class SchoolYearsModule {}
