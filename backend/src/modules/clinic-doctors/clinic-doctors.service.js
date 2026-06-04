const prisma = require('../../config/prisma');

const listDoctors = async (tenantId) => {
  const [staff, profiles] = await Promise.all([
    prisma.staff.findMany({
      where: { tenantId, isActive: true, role: { in: ['DOCTOR', 'Doctor', 'doctor'] } },
      orderBy: { name: 'asc' },
    }),
    prisma.clinicDoctorProfile.findMany({ where: { tenantId } }),
  ]);

  const profileMap = Object.fromEntries(profiles.map((p) => [p.staffId, p]));
  return staff.map((s) => ({ ...s, profile: profileMap[s.id] || null }));
};

const getAllStaff = (tenantId) =>
  prisma.staff.findMany({ where: { tenantId, isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, role: true } });

const getProfileByStaffId = async (tenantId, staffId) => {
  const profile = await prisma.clinicDoctorProfile.findFirst({ where: { tenantId, staffId } });
  const staff = await prisma.staff.findFirst({ where: { id: staffId, tenantId } });
  return { staff, profile };
};

const upsertProfile = async (tenantId, staffId, data) => {
  const { specialization, mciRegNumber, consultationFee, followUpFee, availableDays, morningStart, morningEnd, eveningStart, eveningEnd, bio, education, experience, languages } = data;

  const existing = await prisma.clinicDoctorProfile.findFirst({ where: { tenantId, staffId } });
  const payload = {
    specialization: specialization || null,
    mciRegNumber: mciRegNumber || null,
    consultationFee: consultationFee ? parseFloat(consultationFee) : null,
    followUpFee: followUpFee ? parseFloat(followUpFee) : null,
    availableDays: availableDays || [],
    morningStart: morningStart || null, morningEnd: morningEnd || null,
    eveningStart: eveningStart || null, eveningEnd: eveningEnd || null,
    bio: bio || null, education: education || null,
    experience: experience ? parseInt(experience) : null,
    languages: languages || [],
  };

  if (existing) return prisma.clinicDoctorProfile.update({ where: { id: existing.id }, data: payload });
  return prisma.clinicDoctorProfile.create({ data: { tenantId, staffId, ...payload } });
};

module.exports = { listDoctors, getAllStaff, getProfileByStaffId, upsertProfile };
