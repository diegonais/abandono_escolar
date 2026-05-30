import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AppController } from "./app.controller";
import { AlertsModule } from "./alerts/alerts.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { AuthModule } from "./auth/auth.module";
import { CoursesModule } from "./courses/courses.module";
import { EnrollmentsModule } from "./enrollments/enrollments.module";
import { GradesModule } from "./grades/grades.module";
import { PrismaModule } from "./prisma/prisma.module";
import { RiskEngineModule } from "./risk-engine/risk-engine.module";
import { SchoolYearsModule } from "./school-years/school-years.module";
import { StudentFollowUpsModule } from "./student-follow-ups/student-follow-ups.module";
import { StudentsModule } from "./students/students.module";
import { SubjectsModule } from "./subjects/subjects.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    AlertsModule,
    AttendanceModule,
    UsersModule,
    SchoolYearsModule,
    CoursesModule,
    SubjectsModule,
    StudentsModule,
    StudentFollowUpsModule,
    EnrollmentsModule,
    GradesModule,
    RiskEngineModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
