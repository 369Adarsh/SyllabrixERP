const prisma = require('../../config/prisma');

// ── Homework ──────────────────────────────────────────────────────────────────

const listHomework = async (tenantId, { from, to, classGroup, subject } = {}) => {
  const where = { tenantId };
  if (classGroup) where.classGroup = { contains: classGroup, mode: 'insensitive' };
  if (subject) where.subject = { contains: subject, mode: 'insensitive' };
  if (from || to) {
    where.dueDate = {};
    if (from) where.dueDate.gte = new Date(from);
    if (to) where.dueDate.lte = new Date(to);
  }
  return prisma.homeworkAssignment.findMany({
    where,
    include: { submissions: { include: { student: { select: { id: true, name: true, phone: true, parentPhone: true, parentName: true, batch: true } } } } },
    orderBy: { dueDate: 'asc' },
  });
};

const createHomework = async (tenantId, { subject, description, classGroup, dueDate, studentIds }) => {
  const hw = await prisma.homeworkAssignment.create({
    data: { tenantId, subject, description, classGroup, dueDate: new Date(dueDate) },
  });
  if (studentIds && studentIds.length) {
    await prisma.homeworkSubmission.createMany({
      data: studentIds.map(studentId => ({ tenantId, homeworkId: hw.id, studentId, status: 'PENDING' })),
      skipDuplicates: true,
    });
  }
  return prisma.homeworkAssignment.findUnique({
    where: { id: hw.id },
    include: { submissions: { include: { student: { select: { id: true, name: true } } } } },
  });
};

const deleteHomework = async (tenantId, id) =>
  prisma.homeworkAssignment.delete({ where: { id, tenantId } });

const updateSubmission = async (tenantId, homeworkId, studentId, { status, notes }) =>
  prisma.homeworkSubmission.upsert({
    where: { homeworkId_studentId: { homeworkId, studentId } },
    create: { tenantId, homeworkId, studentId, status, notes },
    update: { status, notes },
  });

const bulkUpdateSubmissions = async (tenantId, homeworkId, updates) => {
  const ops = updates.map(({ studentId, status, notes }) =>
    prisma.homeworkSubmission.upsert({
      where: { homeworkId_studentId: { homeworkId, studentId } },
      create: { tenantId, homeworkId, studentId, status, notes },
      update: { status, notes },
    })
  );
  return prisma.$transaction(ops);
};

// ── Teaching Log ──────────────────────────────────────────────────────────────

const listTeachingLogs = async (tenantId, { classGroup, subject, from, to } = {}) => {
  const where = { tenantId };
  if (classGroup) where.classGroup = { contains: classGroup, mode: 'insensitive' };
  if (subject) where.subject = { contains: subject, mode: 'insensitive' };
  if (from || to) {
    where.taughtDate = {};
    if (from) where.taughtDate.gte = new Date(from);
    if (to) where.taughtDate.lte = new Date(to);
  }
  return prisma.teachingLog.findMany({ where, orderBy: { taughtDate: 'desc' } });
};

const createTeachingLog = async (tenantId, data) =>
  prisma.teachingLog.create({ data: { ...data, tenantId, taughtDate: data.taughtDate ? new Date(data.taughtDate) : new Date() } });

const deleteTeachingLog = async (tenantId, id) =>
  prisma.teachingLog.delete({ where: { id, tenantId } });

// ── Student Progress Analytics ────────────────────────────────────────────────

const getStudentProgress = async (tenantId) => {
  const students = await prisma.student.findMany({
    where: { tenantId, isActive: true },
    select: {
      id: true, name: true, phone: true, parentName: true, parentPhone: true,
      course: true, batch: true,
      homeworkSubmissions: {
        select: { status: true, updatedAt: true, homework: { select: { subject: true, dueDate: true } } },
      },
    },
  });

  return students.map(s => {
    const subs = s.homeworkSubmissions;
    const total = subs.length;
    const done = subs.filter(x => x.status === 'DONE').length;
    const partial = subs.filter(x => x.status === 'PARTIAL').length;
    const completionPct = total > 0 ? Math.round(((done + partial * 0.5) / total) * 100) : null;

    // Streak: consecutive days with DONE status (looking back from today)
    const doneDates = [...new Set(
      subs.filter(x => x.status === 'DONE' && x.homework?.dueDate)
        .map(x => new Date(x.homework.dueDate).toDateString())
    )].sort().reverse();

    let streak = 0;
    const today = new Date();
    for (let i = 0; i < doneDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(today.getDate() - i);
      if (doneDates[i] === expected.toDateString()) streak++;
      else break;
    }

    // Subject breakdown
    const subjectMap = {};
    subs.forEach(x => {
      const subj = x.homework?.subject || 'Other';
      if (!subjectMap[subj]) subjectMap[subj] = { total: 0, done: 0 };
      subjectMap[subj].total++;
      if (x.status === 'DONE') subjectMap[subj].done++;
    });

    return { ...s, homeworkSubmissions: undefined, total, done, partial, completionPct, streak, subjectMap };
  });
};

// ── Exams ─────────────────────────────────────────────────────────────────────

const STUDENT_SELECT = { id: true, name: true, phone: true, parentName: true, parentPhone: true, batch: true, course: true };

const listExams = async (tenantId) =>
  prisma.exam.findMany({
    where: { tenantId },
    include: { studentPreps: { include: { student: { select: STUDENT_SELECT } } } },
    orderBy: { examDate: 'asc' },
  });

const createExam = async (tenantId, { title, subject, examType, classGroup, examDate, totalMarks, topics, studentIds }) => {
  const exam = await prisma.exam.create({
    data: { tenantId, title, subject, examType: examType || 'UNIT_TEST', classGroup: classGroup || '', examDate: new Date(examDate), totalMarks: totalMarks || null, topics: topics || [] },
  });
  if (studentIds?.length) {
    await prisma.examStudentPrep.createMany({
      data: studentIds.map(studentId => ({ examId: exam.id, studentId, tenantId, readiness: 0, weakTopics: [] })),
      skipDuplicates: true,
    });
  }
  return prisma.exam.findUnique({
    where: { id: exam.id },
    include: { studentPreps: { include: { student: { select: STUDENT_SELECT } } } },
  });
};

const updateExam = async (tenantId, id, { title, subject, examType, classGroup, examDate, totalMarks, topics }) =>
  prisma.exam.update({
    where: { id, tenantId },
    data: {
      ...(title       !== undefined && { title }),
      ...(subject     !== undefined && { subject }),
      ...(examType    !== undefined && { examType }),
      ...(classGroup  !== undefined && { classGroup }),
      ...(examDate    !== undefined && { examDate: new Date(examDate) }),
      ...(totalMarks  !== undefined && { totalMarks }),
      ...(topics      !== undefined && { topics }),
    },
    include: { studentPreps: { include: { student: { select: STUDENT_SELECT } } } },
  });

const deleteExam = async (tenantId, id) =>
  prisma.exam.delete({ where: { id, tenantId } });

const upsertStudentPrep = async (tenantId, examId, studentId, { readiness, weakTopics, notes, marksObtained, grade }) =>
  prisma.examStudentPrep.upsert({
    where: { examId_studentId: { examId, studentId } },
    create: { examId, studentId, tenantId, readiness: readiness ?? 0, weakTopics: weakTopics ?? [], notes, marksObtained, grade },
    update: {
      ...(readiness     !== undefined && { readiness }),
      ...(weakTopics    !== undefined && { weakTopics }),
      ...(notes         !== undefined && { notes }),
      ...(marksObtained !== undefined && { marksObtained }),
      ...(grade         !== undefined && { grade }),
    },
    include: { student: { select: STUDENT_SELECT } },
  });

module.exports = {
  listHomework, createHomework, deleteHomework,
  updateSubmission, bulkUpdateSubmissions,
  listTeachingLogs, createTeachingLog, deleteTeachingLog,
  getStudentProgress,
  listExams, createExam, updateExam, deleteExam, upsertStudentPrep,
};
