import { Module } from "@nestjs/common";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { CoursesController } from "./courses.controller";
import { CoursesService } from "./courses.service";

@Module({
  imports: [PrismaModule],
  controllers: [CoursesController],
  providers: [CoursesService, RolesGuard],
})
export class CoursesModule {}
