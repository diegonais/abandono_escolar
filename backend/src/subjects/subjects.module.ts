import { Module } from "@nestjs/common";
import { RolesGuard } from "../auth/guards/roles.guard";
import { PrismaModule } from "../prisma/prisma.module";
import { SubjectsController } from "./subjects.controller";
import { SubjectsService } from "./subjects.service";

@Module({
  imports: [PrismaModule],
  controllers: [SubjectsController],
  providers: [SubjectsService, RolesGuard],
})
export class SubjectsModule {}
