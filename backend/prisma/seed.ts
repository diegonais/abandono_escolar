import {
  AcademicPeriod,
  AttendanceStatus,
  FollowUpType,
  PrismaClient,
  RoleName,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const ROLE_NAMES: RoleName[] = [
  RoleName.ADMIN,
  RoleName.DIRECTOR,
  RoleName.DOCENTE,
  RoleName.SEGUIMIENTO,
];

const SUBJECTS = [
  { name: 'Matematica', code: 'MAT' },
  { name: 'Lenguaje', code: 'LEN' },
  { name: 'Ciencias Sociales', code: 'CSO' },
  { name: 'Ciencias Naturales', code: 'CNA' },
];

const STUDENTS = [
  {
    firstName: 'Juan',
    lastName: 'Perez',
    ci: '9000001',
    gender: 'M',
    tutorName: 'Carlos Perez',
    tutorPhone: '70000001',
  },
  {
    firstName: 'Maria',
    lastName: 'Lopez',
    ci: '9000002',
    gender: 'F',
    tutorName: 'Ana Lopez',
    tutorPhone: '70000002',
  },
  {
    firstName: 'Luis',
    lastName: 'Flores',
    ci: '9000003',
    gender: 'M',
    tutorName: 'Julia Flores',
    tutorPhone: '70000003',
  },
  {
    firstName: 'Sofia',
    lastName: 'Quispe',
    ci: '9000004',
    gender: 'F',
    tutorName: 'Rene Quispe',
    tutorPhone: '70000004',
  },
  {
    firstName: 'Diego',
    lastName: 'Mamani',
    ci: '9000005',
    gender: 'M',
    tutorName: 'Lidia Mamani',
    tutorPhone: '70000005',
  },
  {
    firstName: 'Camila',
    lastName: 'Rojas',
    ci: '9000006',
    gender: 'F',
    tutorName: 'Oscar Rojas',
    tutorPhone: '70000006',
  },
  {
    firstName: 'Mateo',
    lastName: 'Vargas',
    ci: '9000007',
    gender: 'M',
    tutorName: 'Elena Vargas',
    tutorPhone: '70000007',
  },
  {
    firstName: 'Valeria',
    lastName: 'Condori',
    ci: '9000008',
    gender: 'F',
    tutorName: 'Hugo Condori',
    tutorPhone: '70000008',
  },
  {
    firstName: 'Andres',
    lastName: 'Choque',
    ci: '9000009',
    gender: 'M',
    tutorName: 'Silvia Choque',
    tutorPhone: '70000009',
  },
  {
    firstName: 'Lucia',
    lastName: 'Castro',
    ci: '9000010',
    gender: 'F',
    tutorName: 'Mario Castro',
    tutorPhone: '70000010',
  },
];

const RISK_CRITERIA = [
  {
    code: 'ABSENCES_GTE_3',
    name: 'Faltas mayores o iguales a 3',
    description: 'Activa riesgo cuando las faltas acumuladas son >= 3',
    metric: 'absences',
    minValue: 3,
    maxValue: null as number | null,
    weight: 1.0,
  },
  {
    code: 'AVG_LT_51',
    name: 'Promedio menor a 51',
    description: 'Activa riesgo cuando el promedio general es menor a 51',
    metric: 'average_grade',
    minValue: null as number | null,
    maxValue: 50.99,
    weight: 1.0,
  },
  {
    code: 'FOLLOWUPS_GTE_2',
    name: 'Seguimientos mayores o iguales a 2',
    description: 'Activa riesgo cuando el estudiante requiere >= 2 seguimientos',
    metric: 'follow_ups',
    minValue: 2,
    maxValue: null as number | null,
    weight: 1.0,
  },
];

function buildDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

async function main() {
  for (const roleName of ROLE_NAMES) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  const adminRole = await prisma.role.findUniqueOrThrow({
    where: { name: RoleName.ADMIN },
  });

  const adminPasswordHash = await bcrypt.hash('Admin123456', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@abandono.test' },
    update: {
      fullName: 'Administrador del Sistema',
      roleId: adminRole.id,
      isActive: true,
      passwordHash: adminPasswordHash,
    },
    create: {
      email: 'admin@abandono.test',
      fullName: 'Administrador del Sistema',
      roleId: adminRole.id,
      isActive: true,
      passwordHash: adminPasswordHash,
    },
  });

  const currentYear = new Date().getUTCFullYear();
  const schoolYear = await prisma.schoolYear.upsert({
    where: { name: `Gestion ${currentYear}` },
    update: {
      startDate: buildDate(currentYear, 1, 1),
      endDate: buildDate(currentYear, 12, 31),
      isActive: true,
    },
    create: {
      name: `Gestion ${currentYear}`,
      startDate: buildDate(currentYear, 1, 1),
      endDate: buildDate(currentYear, 12, 31),
      isActive: true,
    },
  });

  const courseDefinitions = [
    { level: '1ro Secundaria', parallel: 'A' },
    { level: '2do Secundaria', parallel: 'A' },
    { level: '3ro Secundaria', parallel: 'A' },
  ];

  const courses = [];
  for (const courseDef of courseDefinitions) {
    const course = await prisma.course.upsert({
      where: {
        level_parallel_schoolYearId: {
          level: courseDef.level,
          parallel: courseDef.parallel,
          schoolYearId: schoolYear.id,
        },
      },
      update: {},
      create: {
        level: courseDef.level,
        parallel: courseDef.parallel,
        schoolYearId: schoolYear.id,
      },
    });
    courses.push(course);
  }

  const subjects = [];
  for (const subjectDef of SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { code: subjectDef.code },
      update: {
        name: subjectDef.name,
        isActive: true,
      },
      create: {
        name: subjectDef.name,
        code: subjectDef.code,
        isActive: true,
      },
    });
    subjects.push(subject);
  }

  const students = [];
  for (const [index, studentDef] of STUDENTS.entries()) {
    const student = await prisma.student.upsert({
      where: { ci: studentDef.ci },
      update: {
        firstName: studentDef.firstName,
        lastName: studentDef.lastName,
        gender: studentDef.gender,
        tutorName: studentDef.tutorName,
        tutorPhone: studentDef.tutorPhone,
        isActive: true,
      },
      create: {
        firstName: studentDef.firstName,
        lastName: studentDef.lastName,
        ci: studentDef.ci,
        birthDate: buildDate(currentYear - 14 - (index % 3), 4 + (index % 4), 10 + index),
        gender: studentDef.gender,
        tutorName: studentDef.tutorName,
        tutorPhone: studentDef.tutorPhone,
        address: `Zona ${index + 1}`,
        isActive: true,
      },
    });
    students.push(student);
  }

  for (const [index, student] of students.entries()) {
    const assignedCourse = courses[index % courses.length];

    await prisma.enrollment.upsert({
      where: {
        studentId_courseId_schoolYearId: {
          studentId: student.id,
          courseId: assignedCourse.id,
          schoolYearId: schoolYear.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        courseId: assignedCourse.id,
        schoolYearId: schoolYear.id,
      },
    });

    for (let attendanceOffset = 0; attendanceOffset < 5; attendanceOffset += 1) {
      const attendanceDate = buildDate(currentYear, 3, 3 + attendanceOffset);
      const missedDays = index % 4 === 0 ? 3 : index % 3 === 0 ? 2 : 1;
      const status =
        attendanceOffset < missedDays
          ? AttendanceStatus.FALTA
          : AttendanceStatus.PRESENTE;

      await prisma.attendance.upsert({
        where: {
          studentId_date_courseId: {
            studentId: student.id,
            date: attendanceDate,
            courseId: assignedCourse.id,
          },
        },
        update: {
          status,
          observation: status === AttendanceStatus.FALTA ? 'Falta registrada en seed' : null,
        },
        create: {
          studentId: student.id,
          courseId: assignedCourse.id,
          date: attendanceDate,
          status,
          observation: status === AttendanceStatus.FALTA ? 'Falta registrada en seed' : null,
        },
      });
    }

    for (const [subjectIndex, subject] of subjects.entries()) {
      const lowPerformance = index % 3 === 0;
      const score = lowPerformance ? 45 + subjectIndex : 62 + index - subjectIndex;

      await prisma.grade.upsert({
        where: {
          studentId_subjectId_courseId_period: {
            studentId: student.id,
            subjectId: subject.id,
            courseId: assignedCourse.id,
            period: AcademicPeriod.BIMESTRE_1,
          },
        },
        update: { score },
        create: {
          studentId: student.id,
          subjectId: subject.id,
          courseId: assignedCourse.id,
          period: AcademicPeriod.BIMESTRE_1,
          score,
        },
      });
    }
  }

  const followUpEntries = students.flatMap((student, index) => {
    const baseDate = buildDate(currentYear, 3, 15 + (index % 4));
    const firstEntry = {
      id: `seed-followup-${index + 1}-1`,
      type: index % 2 === 0 ? FollowUpType.ACADEMICO : FollowUpType.CONDUCTUAL,
      description: `Seguimiento inicial para ${student.firstName} ${student.lastName}`,
      actionTaken: 'Se notifico al tutor y se coordino plan de apoyo.',
      followUpDate: baseDate,
      nextReviewDate: buildDate(currentYear, 3, 22 + (index % 4)),
      studentId: student.id,
      responsibleUserId: adminUser.id,
    };

    if (index < 4) {
      return [
        firstEntry,
        {
          id: `seed-followup-${index + 1}-2`,
          type: FollowUpType.FAMILIAR,
          description: `Segundo seguimiento para ${student.firstName} ${student.lastName}`,
          actionTaken: 'Se realizo reunion familiar para reforzar compromisos.',
          followUpDate: buildDate(currentYear, 3, 25 + index),
          nextReviewDate: buildDate(currentYear, 4, 3 + index),
          studentId: student.id,
          responsibleUserId: adminUser.id,
        },
      ];
    }

    return [firstEntry];
  });

  for (const followUp of followUpEntries) {
    await prisma.studentFollowUp.upsert({
      where: { id: followUp.id },
      update: {
        type: followUp.type,
        description: followUp.description,
        actionTaken: followUp.actionTaken,
        followUpDate: followUp.followUpDate,
        nextReviewDate: followUp.nextReviewDate,
        studentId: followUp.studentId,
        responsibleUserId: followUp.responsibleUserId,
      },
      create: followUp,
    });
  }

  for (const criterion of RISK_CRITERIA) {
    await prisma.riskCriterion.upsert({
      where: { code: criterion.code },
      update: {
        name: criterion.name,
        description: criterion.description,
        metric: criterion.metric,
        minValue: criterion.minValue,
        maxValue: criterion.maxValue,
        weight: criterion.weight,
        isActive: true,
      },
      create: {
        code: criterion.code,
        name: criterion.name,
        description: criterion.description,
        metric: criterion.metric,
        minValue: criterion.minValue,
        maxValue: criterion.maxValue,
        weight: criterion.weight,
        isActive: true,
      },
    });
  }

  console.log('Seed completado correctamente.');
}

main()
  .catch((error) => {
    console.error('Error ejecutando seed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
