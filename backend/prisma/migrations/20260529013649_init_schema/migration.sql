-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'DIRECTOR', 'DOCENTE', 'SEGUIMIENTO');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'JUSTIFIED');

-- CreateEnum
CREATE TYPE "FollowUpType" AS ENUM ('ACADEMIC', 'ATTENDANCE', 'BEHAVIORAL', 'FAMILY', 'SOCIAL', 'PSYCHOLOGICAL');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AcademicPeriod" AS ENUM ('FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM', 'FINAL');

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_years" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_years_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "parallel" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "ci" TEXT,
    "birthDate" TIMESTAMP(3),
    "gender" TEXT,
    "tutorName" TEXT,
    "tutorPhone" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendances" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "observation" TEXT,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "period" "AcademicPeriod" NOT NULL,
    "studentId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_follow_ups" (
    "id" TEXT NOT NULL,
    "type" "FollowUpType" NOT NULL,
    "description" TEXT NOT NULL,
    "actionTaken" TEXT,
    "followUpDate" TIMESTAMP(3) NOT NULL,
    "nextReviewDate" TIMESTAMP(3),
    "studentId" TEXT NOT NULL,
    "responsibleUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_follow_ups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_criteria" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "metric" TEXT NOT NULL,
    "minValue" DECIMAL(8,2),
    "maxValue" DECIMAL(8,2),
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_evaluations" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "riskScore" DECIMAL(6,2),
    "attendanceRate" DECIMAL(5,2),
    "averageGrade" DECIMAL(5,2),
    "totalAbsences" INTEGER,
    "indicators" JSONB,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "status" "AlertStatus" NOT NULL,
    "studentId" TEXT NOT NULL,
    "schoolYearId" TEXT NOT NULL,
    "riskEvaluationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_roleId_idx" ON "users"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "school_years_name_key" ON "school_years"("name");

-- CreateIndex
CREATE INDEX "courses_schoolYearId_idx" ON "courses"("schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "courses_level_parallel_schoolYearId_key" ON "courses"("level", "parallel", "schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_key" ON "subjects"("code");

-- CreateIndex
CREATE UNIQUE INDEX "students_ci_key" ON "students"("ci");

-- CreateIndex
CREATE INDEX "enrollments_studentId_idx" ON "enrollments"("studentId");

-- CreateIndex
CREATE INDEX "enrollments_courseId_idx" ON "enrollments"("courseId");

-- CreateIndex
CREATE INDEX "enrollments_schoolYearId_idx" ON "enrollments"("schoolYearId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_studentId_courseId_schoolYearId_key" ON "enrollments"("studentId", "courseId", "schoolYearId");

-- CreateIndex
CREATE INDEX "attendances_studentId_idx" ON "attendances"("studentId");

-- CreateIndex
CREATE INDEX "attendances_courseId_idx" ON "attendances"("courseId");

-- CreateIndex
CREATE INDEX "attendances_date_idx" ON "attendances"("date");

-- CreateIndex
CREATE INDEX "attendances_status_idx" ON "attendances"("status");

-- CreateIndex
CREATE INDEX "attendances_studentId_courseId_date_status_idx" ON "attendances"("studentId", "courseId", "date", "status");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_studentId_date_courseId_key" ON "attendances"("studentId", "date", "courseId");

-- CreateIndex
CREATE INDEX "grades_studentId_idx" ON "grades"("studentId");

-- CreateIndex
CREATE INDEX "grades_subjectId_idx" ON "grades"("subjectId");

-- CreateIndex
CREATE INDEX "grades_courseId_idx" ON "grades"("courseId");

-- CreateIndex
CREATE INDEX "grades_period_idx" ON "grades"("period");

-- CreateIndex
CREATE INDEX "grades_studentId_subjectId_courseId_period_idx" ON "grades"("studentId", "subjectId", "courseId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "grades_studentId_subjectId_courseId_period_key" ON "grades"("studentId", "subjectId", "courseId", "period");

-- CreateIndex
CREATE INDEX "student_follow_ups_studentId_idx" ON "student_follow_ups"("studentId");

-- CreateIndex
CREATE INDEX "student_follow_ups_type_idx" ON "student_follow_ups"("type");

-- CreateIndex
CREATE INDEX "student_follow_ups_followUpDate_idx" ON "student_follow_ups"("followUpDate");

-- CreateIndex
CREATE INDEX "student_follow_ups_studentId_type_followUpDate_idx" ON "student_follow_ups"("studentId", "type", "followUpDate");

-- CreateIndex
CREATE UNIQUE INDEX "risk_criteria_code_key" ON "risk_criteria"("code");

-- CreateIndex
CREATE INDEX "risk_criteria_metric_idx" ON "risk_criteria"("metric");

-- CreateIndex
CREATE INDEX "risk_criteria_isActive_idx" ON "risk_criteria"("isActive");

-- CreateIndex
CREATE INDEX "risk_evaluations_studentId_idx" ON "risk_evaluations"("studentId");

-- CreateIndex
CREATE INDEX "risk_evaluations_riskLevel_idx" ON "risk_evaluations"("riskLevel");

-- CreateIndex
CREATE INDEX "risk_evaluations_createdAt_idx" ON "risk_evaluations"("createdAt");

-- CreateIndex
CREATE INDEX "risk_evaluations_studentId_riskLevel_createdAt_idx" ON "risk_evaluations"("studentId", "riskLevel", "createdAt");

-- CreateIndex
CREATE INDEX "risk_evaluations_schoolYearId_idx" ON "risk_evaluations"("schoolYearId");

-- CreateIndex
CREATE INDEX "alerts_studentId_idx" ON "alerts"("studentId");

-- CreateIndex
CREATE INDEX "alerts_riskLevel_idx" ON "alerts"("riskLevel");

-- CreateIndex
CREATE INDEX "alerts_status_idx" ON "alerts"("status");

-- CreateIndex
CREATE INDEX "alerts_studentId_riskLevel_status_idx" ON "alerts"("studentId", "riskLevel", "status");

-- CreateIndex
CREATE INDEX "alerts_schoolYearId_idx" ON "alerts"("schoolYearId");

-- CreateIndex
CREATE INDEX "alerts_riskEvaluationId_idx" ON "alerts"("riskEvaluationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_follow_ups" ADD CONSTRAINT "student_follow_ups_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_follow_ups" ADD CONSTRAINT "student_follow_ups_responsibleUserId_fkey" FOREIGN KEY ("responsibleUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_evaluations" ADD CONSTRAINT "risk_evaluations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_evaluations" ADD CONSTRAINT "risk_evaluations_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_schoolYearId_fkey" FOREIGN KEY ("schoolYearId") REFERENCES "school_years"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_riskEvaluationId_fkey" FOREIGN KEY ("riskEvaluationId") REFERENCES "risk_evaluations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
