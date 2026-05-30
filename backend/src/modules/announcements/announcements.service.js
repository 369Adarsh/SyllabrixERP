const prisma = require('../../config/prisma');

// body ↔ content: frontend uses "body", Prisma model uses "content"
const toApi = (a) => a ? { ...a, body: a.content } : a;

// Tenant-facing: published announcements matching their business type (or global)
const getForTenant = async (tenantId) => {
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { businessType: true } });
  const now = new Date();
  const rows = await prisma.platformAnnouncement.findMany({
    where: {
      isPublished: true,
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
        { OR: [
          { targetTypes: { isEmpty: true } },
          { targetTypes: { has: tenant.businessType } },
          { targetTypes: { has: 'ALL' } },
        ]},
      ],
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });
  return rows.map(toApi);
};

// SA: CRUD
const list = async (includeUnpublished = false) => {
  const rows = await prisma.platformAnnouncement.findMany({
    where: includeUnpublished ? {} : { isPublished: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toApi);
};

const create = ({ body, content, targetTypes, isPublished, expiresAt, title, type }, adminName) =>
  prisma.platformAnnouncement.create({
    data: {
      title,
      content: body || content || '',
      type: type || 'INFO',
      targetTypes: targetTypes || [],
      isPublished: !!isPublished,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: adminName,
      publishedAt: isPublished ? new Date() : null,
    },
  }).then(toApi);

const update = async (id, { body, content, ...rest }) => {
  const data = { ...rest };
  if (body !== undefined || content !== undefined) data.content = body || content;
  if (data.isPublished) {
    const existing = await prisma.platformAnnouncement.findUnique({ where: { id }, select: { publishedAt: true } });
    if (!existing.publishedAt) data.publishedAt = new Date();
  }
  return prisma.platformAnnouncement.update({ where: { id }, data }).then(toApi);
};

const remove = (id) => prisma.platformAnnouncement.delete({ where: { id } });

const publish = (id) =>
  prisma.platformAnnouncement.update({ where: { id }, data: { isPublished: true, publishedAt: new Date() } });

const unpublish = (id) =>
  prisma.platformAnnouncement.update({ where: { id }, data: { isPublished: false } });

module.exports = { getForTenant, list, create, update, remove, publish, unpublish };
