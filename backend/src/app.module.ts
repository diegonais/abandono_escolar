import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { CoursesModule } from "./courses/courses.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { PrismaModule } from "./prisma/prisma.module";
import { SchoolYearsModule } from "./school-years/school-years.module";
import { StudentsModule } from "./students/students.module";
import { SubjectsModule } from "./subjects/subjects.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    SchoolYearsModule,
    CoursesModule,
    SubjectsModule,
    StudentsModule,
    EnrollmentsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
