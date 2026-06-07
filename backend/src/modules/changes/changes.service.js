const prisma = require('../../config/prisma');

const generateCode = async (type) => {
  const year = new Date().getFullYear();
  const prefix = type === 'CR' ? 'CR' : 'ENH';
  const count = await prisma.changeRequest.count({
    where: { crCode: { startsWith: `${prefix}-${year}-` } },
  });
  return `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`;
};

const getStats = async () => {
  const [byStatus, byType, total] = await Promise.all([
    prisma.changeRequest.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.changeRequest.groupBy({ by: ['type'],   _count: { id: true } }),
    prisma.changeRequest.count(),
  ]);
  const s = Object.fromEntries(byStatus.map((r) => [r.status, r._count.id]));
  const t = Object.fromEntries(byType.map((r) => [r.type, r._count.id]));
  return {
    total,
    draft:         s.DRAFT          || 0,
    approved:      s.APPROVED       || 0,
    inDevelopment: s.IN_DEVELOPMENT || 0,
    completed:     s.COMPLETED      || 0,
    rejected:      s.REJECTED       || 0,
    crs:           t.CR             || 0,
    enhancements:  t.ENHANCEMENT    || 0,
  };
};

const list = async ({ type, status, search } = {}) => {
  const where = {};
  if (type)   where.type   = type;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { title:            { contains: search, mode: 'insensitive' } },
      { crCode:           { contains: search, mode: 'insensitive' } },
      { businessTypeCode: { contains: search, mode: 'insensitive' } },
    ];
  }
  return prisma.changeRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
};

const get = async (id) =>
  prisma.changeRequest.findUnique({
    where:   { id },
    include: { logs: { orderBy: { createdAt: 'asc' } } },
  });

const create = async (data, adminName) => {
  const crCode = await generateCode(data.type);
  return prisma.changeRequest.create({
    data: {
      crCode,
      type:             data.type,
      title:            data.title,
      description:      data.description      || null,
      problem:          data.problem          || null,
      solution:         data.solution         || null,
      inScope:          data.inScope          || null,
      outOfScope:       data.outOfScope       || null,
      businessTypeCode: data.businessTypeCode,
      modulesAffected:  data.modulesAffected  || [],
      priority:         data.priority         || 'MEDIUM',
      crTarget:         data.crTarget         || 'BUSINESS_PLATFORM',
      raisedFrom:       data.raisedFrom       || null,
      createdBy:        adminName,
      logs: { create: { action: 'CREATED', performedBy: adminName, notes: `${crCode} created` } },
    },
  });
};

const approve = async (id, adminName) => {
  const cr = await prisma.changeRequest.findUnique({ where: { id } });
  if (!cr) throw new Error('Change request not found');
  if (cr.status !== 'DRAFT') throw new Error('Only DRAFT change requests can be approved');
  return prisma.changeRequest.update({
    where: { id },
    data: {
      status:     'APPROVED',
      approvedBy: adminName,
      approvedAt: new Date(),
      logs: { create: { action: 'APPROVED', performedBy: adminName, notes: 'Approved — ready for development' } },
    },
    include: { logs: { orderBy: { createdAt: 'asc' } } },
  });
};

const reject = async (id, reason, adminName) => {
  const cr = await prisma.changeRequest.findUnique({ where: { id } });
  if (!cr) throw new Error('Change request not found');
  if (cr.status !== 'DRAFT') throw new Error('Only DRAFT change requests can be rejected');
  return prisma.changeRequest.update({
    where: { id },
    data: {
      status:          'REJECTED',
      rejectedBy:      adminName,
      rejectedAt:      new Date(),
      rejectionReason: reason || null,
      logs: { create: { action: 'REJECTED', performedBy: adminName, notes: reason || 'No reason given' } },
    },
  });
};

const generateDocument = async (id) => {
  const cr = await prisma.changeRequest.findUnique({ where: { id } });
  if (!cr) throw new Error('Change request not found');
  if (cr.status === 'DRAFT') throw new Error('Only approved change requests can generate a document');

  const typeLabel = cr.type === 'CR' ? 'Change Request' : 'Enhancement';
  const content = [
    `# ${cr.crCode} — ${cr.title}`,
    '',
    `| Field            | Value                                                    |`,
    `|------------------|----------------------------------------------------------|`,
    `| Document ID      | ${cr.crCode}                                             |`,
    `| Type             | ${typeLabel}                                             |`,
    `| Title            | ${cr.title}                                              |`,
    `| Business Type    | ${cr.businessTypeCode}                                   |`,
    `| Modules Affected | ${(cr.modulesAffected || []).join(', ') || '—'}           |`,
    `| Priority         | ${cr.priority}                                           |`,
    `| CR Target        | ${cr.crTarget || 'BUSINESS_PLATFORM'}                    |`,
    `| Raised From      | ${cr.raisedFrom || '—'}                                  |`,
    `| Status           | ${cr.status}                                             |`,
    `| Approved By      | ${cr.approvedBy || '—'}                                  |`,
    `| Approved At      | ${cr.approvedAt ? new Date(cr.approvedAt).toLocaleString('en-IN') : '—'} |`,
    '',
    '---',
    '',
    '## Problem',
    '',
    cr.problem || '(not specified)',
    '',
    '---',
    '',
    '## Solution',
    '',
    cr.solution || '(not specified)',
    '',
    '---',
    '',
    '## In Scope',
    '',
    cr.inScope || '(not specified)',
    '',
    '---',
    '',
    '## Out of Scope',
    '',
    cr.outOfScope || '(not specified)',
    '',
    '---',
    '',
    `*Generated by Syllabrix Nerve Center — ${new Date().toLocaleString('en-IN')}*`,
    `*${cr.crCode} — Do not modify this file manually.*`,
  ].join('\n');

  return { content, filename: `${cr.crCode}.md` };
};

module.exports = { getStats, list, get, create, approve, reject, generateDocument };
