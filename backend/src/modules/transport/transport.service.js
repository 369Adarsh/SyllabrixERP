const prisma = require('../../config/prisma');
const config = require('../../config/env');

// ── TR Code generator ──────────────────────────────────────────────────────────
const generateTRCode = async () => {
  const year = new Date().getFullYear();
  const count = await prisma.transportRequest.count({
    where: { trCode: { startsWith: `TR-${year}-` } },
  });
  const seq = String(count + 1).padStart(3, '0');
  return `TR-${year}-${seq}`;
};

// ── GitHub API helper ──────────────────────────────────────────────────────────
const githubApi = async (method, path, body = null) => {
  const { githubToken: token, githubOwner: owner, githubRepo: repo } = config;
  if (!token || !owner || !repo) {
    throw new Error('GitHub not configured. Add GITHUB_ACCESS_TOKEN, GITHUB_OWNER, GITHUB_REPO to .env');
  }

  const url = `https://api.github.com/repos/${owner}/${repo}${path}`;
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      'User-Agent': 'Syllabrix-Nerve-Center',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  if (res.status === 204) return null; // No Content — already up to date
  const data = await res.json();
  if (!res.ok) throw new Error(`GitHub API: ${data.message || res.statusText}`);
  return data;
};

// ── Stats ─────────────────────────────────────────────────────────────────────
const getStats = async () => {
  const [byStatus, recent, total] = await Promise.all([
    prisma.transportRequest.groupBy({ by: ['status'], _count: { id: true } }),
    prisma.transportRequest.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
    prisma.transportRequest.count(),
  ]);

  const s = Object.fromEntries(byStatus.map((r) => [r.status, r._count.id]));
  return {
    total,
    draft:        s.DRAFT         || 0,
    approved:     s.APPROVED      || 0,
    development:  s.DEVELOPMENT   || 0,
    testing:      s.TESTING       || 0,
    inQuality:    s.IN_QUALITY    || 0,
    inProduction: s.IN_PRODUCTION || 0,
    rolledBack:   s.ROLLED_BACK   || 0,
    recent,
  };
};

// ── List ───────────────────────────────────────────────────────────────────────
const list = async ({ status, category, priority, businessTypeCode, search } = {}) => {
  const where = {};
  if (status)           where.status = status;
  if (category)         where.category = category;
  if (priority)         where.priority = priority;
  if (businessTypeCode) where.businessTypeCode = { contains: businessTypeCode, mode: 'insensitive' };
  if (search) {
    where.OR = [
      { title:            { contains: search, mode: 'insensitive' } },
      { trCode:           { contains: search, mode: 'insensitive' } },
      { description:      { contains: search, mode: 'insensitive' } },
      { businessTypeCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  return prisma.transportRequest.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }],
    include: { _count: { select: { comments: true, testScenarios: true } } },
  });
};

// ── Get single ─────────────────────────────────────────────────────────────────
const get = async (id) =>
  prisma.transportRequest.findUnique({
    where: { id },
    include: {
      logs:          { orderBy: { createdAt: 'asc' } },
      comments:      { orderBy: { createdAt: 'asc' } },
      testScenarios: { orderBy: { createdAt: 'asc' } },
    },
  });

// ── Create ─────────────────────────────────────────────────────────────────────
const create = async (data, adminName) => {
  const trCode = await generateTRCode();
  return prisma.transportRequest.create({
    data: {
      trCode,
      title:            data.title,
      description:      data.description   || null,
      category:         data.category,
      businessTypeCode: data.businessTypeCode,
      modulesAffected:  data.modulesAffected || [],
      priority:         data.priority       || 'MEDIUM',
      problem:          data.problem        || null,
      solution:         data.solution       || null,
      inScope:          data.inScope        || null,
      outOfScope:       data.outOfScope     || null,
      gitCommits:       data.gitCommits     || [],
      testPlanNotes:    data.testPlanNotes  || null,
      createdBy:        adminName,
      logs: {
        create: {
          action:      'CREATED',
          toStatus:    'DRAFT',
          performedBy: adminName,
          notes:       `TR ${trCode} created — awaiting approval`,
        },
      },
    },
  });
};

// ── Approve ────────────────────────────────────────────────────────────────────
const approve = async (id, adminName) => {
  const tr = await prisma.transportRequest.findUnique({ where: { id } });
  if (!tr) throw new Error('TR not found');
  if (tr.status !== 'DRAFT') throw new Error('Only DRAFT TRs can be approved');

  return prisma.transportRequest.update({
    where: { id },
    data: {
      status:     'APPROVED',
      approvedBy: adminName,
      approvedAt: new Date(),
      logs: {
        create: {
          action:      'APPROVED',
          fromStatus:  'DRAFT',
          toStatus:    'APPROVED',
          performedBy: adminName,
          notes:       'TR approved — ready for development',
        },
      },
    },
  });
};

// ── Update ─────────────────────────────────────────────────────────────────────
const update = async (id, data) =>
  prisma.transportRequest.update({
    where: { id },
    data: {
      title:            data.title,
      description:      data.description,
      category:         data.category,
      businessTypeCode: data.businessTypeCode,
      modulesAffected:  data.modulesAffected,
      priority:         data.priority,
      gitCommits:       data.gitCommits,
      testPlanNotes:    data.testPlanNotes,
      assignedReviewer: data.assignedReviewer,
    },
  });

// ── Promote ────────────────────────────────────────────────────────────────────
const PROMOTE_MAP = {
  APPROVED:    { next: 'DEVELOPMENT',  action: 'STATUS_CHANGED',          git: null },
  DEVELOPMENT: { next: 'TESTING',      action: 'STATUS_CHANGED',          git: null },
  TESTING:     { next: 'IN_QUALITY',   action: 'PROMOTED_TO_QUALITY',     git: { from: 'dev',     to: 'quality' } },
  IN_QUALITY:  { next: 'IN_PRODUCTION', action: 'PROMOTED_TO_PRODUCTION', git: { from: 'quality', to: 'main'    } },
};

const promote = async (id, adminName, notes) => {
  const tr = await prisma.transportRequest.findUnique({ where: { id } });
  if (!tr) throw new Error('TR not found');

  const step = PROMOTE_MAP[tr.status];
  if (!step) throw new Error(`Cannot promote TR with status ${tr.status}`);
  if (tr.scopeLocked) throw new Error(`TR is scope-locked (${tr.businessTypeCode}). Unlock before promoting.`);

  let mergeData = {};

  if (step.git) {
    const { from, to } = step.git;
    const targetRef = await githubApi('GET', `/git/ref/heads/${to}`);
    const preMergeSha = targetRef.object.sha;

    await githubApi('POST', '/merges', {
      base: to,
      head: from,
      commit_message: `${tr.trCode}: ${tr.title} — Promoted to ${to === 'quality' ? 'Quality' : 'Production'} [Syllabrix TR]`,
    });

    if (to === 'quality') mergeData.preMergeQualitySha = preMergeSha;
    if (to === 'main')    mergeData.preMergeProdSha    = preMergeSha;
  }

  const now = new Date();
  const timeField =
    step.next === 'IN_QUALITY'    ? { promotedToQualityAt: now } :
    step.next === 'IN_PRODUCTION' ? { promotedToProdAt: now }    : {};

  return prisma.transportRequest.update({
    where: { id },
    data: {
      status: step.next,
      ...timeField,
      ...mergeData,
      logs: {
        create: {
          action:      step.action,
          fromStatus:  tr.status,
          toStatus:    step.next,
          performedBy: adminName,
          notes:       notes || null,
        },
      },
    },
  });
};

// ── Rollback ───────────────────────────────────────────────────────────────────
const rollback = async (id, reason, adminName) => {
  const tr = await prisma.transportRequest.findUnique({ where: { id } });
  if (!tr) throw new Error('TR not found');
  if (!['IN_QUALITY', 'IN_PRODUCTION'].includes(tr.status)) {
    throw new Error('Only TRs in Quality or Production can be rolled back');
  }

  if (tr.status === 'IN_QUALITY' && tr.preMergeQualitySha) {
    await githubApi('PATCH', '/git/refs/heads/quality', { sha: tr.preMergeQualitySha, force: true });
  }
  if (tr.status === 'IN_PRODUCTION' && tr.preMergeProdSha) {
    await githubApi('PATCH', '/git/refs/heads/main', { sha: tr.preMergeProdSha, force: true });
  }

  return prisma.transportRequest.update({
    where: { id },
    data: {
      status:          'ROLLED_BACK',
      rolledBackAt:    new Date(),
      rolledBackReason: reason,
      logs: {
        create: {
          action:      'ROLLED_BACK',
          fromStatus:  tr.status,
          toStatus:    'ROLLED_BACK',
          performedBy: adminName,
          notes:       reason,
        },
      },
    },
  });
};

// ── Scope lock toggle ──────────────────────────────────────────────────────────
const toggleScopeLock = async (id, adminName) => {
  const tr = await prisma.transportRequest.findUnique({ where: { id }, select: { scopeLocked: true } });
  if (!tr) throw new Error('TR not found');
  const locked = !tr.scopeLocked;
  return prisma.transportRequest.update({
    where: { id },
    data: {
      scopeLocked: locked,
      logs: {
        create: { action: locked ? 'SCOPE_LOCKED' : 'SCOPE_UNLOCKED', performedBy: adminName },
      },
    },
  });
};

// ── Comments ───────────────────────────────────────────────────────────────────
const addComment = async (trId, body, adminName) => {
  const [comment] = await Promise.all([
    prisma.transportComment.create({ data: { trId, body, author: adminName } }),
    prisma.transportLog.create({
      data: { trId, action: 'COMMENT_ADDED', performedBy: adminName, notes: body.slice(0, 120) },
    }),
  ]);
  return comment;
};

// ── Test scenarios ─────────────────────────────────────────────────────────────
const addTestScenario = async (trId, data) =>
  prisma.transportTestScenario.create({
    data: { trId, title: data.title, steps: data.steps || null, expectedResult: data.expectedResult || null },
  });

const updateTestResult = async (scenarioId, data, adminName) => {
  const scenario = await prisma.transportTestScenario.update({
    where: { id: scenarioId },
    data:  { result: data.result, testedBy: adminName, testedAt: new Date(), notes: data.notes || null },
  });
  await prisma.transportLog.create({
    data: { trId: scenario.trId, action: 'TEST_RESULT_RECORDED', performedBy: adminName, notes: `${scenario.title}: ${data.result}` },
  });
  return scenario;
};

// ── Environment status ─────────────────────────────────────────────────────────
const getEnvironments = async () => {
  const [devCount, qualityTRs, prodTRs, rollbacks] = await Promise.all([
    prisma.transportRequest.count({ where: { status: 'DEVELOPMENT' } }),
    prisma.transportRequest.findMany({ where: { status: 'IN_QUALITY' },    orderBy: { promotedToQualityAt: 'desc' }, take: 10 }),
    prisma.transportRequest.findMany({ where: { status: 'IN_PRODUCTION' }, orderBy: { promotedToProdAt: 'desc'    }, take: 10 }),
    prisma.transportRequest.findMany({ where: { status: 'ROLLED_BACK' },   orderBy: { rolledBackAt: 'desc'        }, take: 5  }),
  ]);

  let branches = null;
  try {
    const [dev, quality, main] = await Promise.all([
      githubApi('GET', '/git/ref/heads/dev'),
      githubApi('GET', '/git/ref/heads/quality'),
      githubApi('GET', '/git/ref/heads/main'),
    ]);
    branches = {
      dev:        { sha: dev.object.sha.slice(0, 7) },
      quality:    { sha: quality.object.sha.slice(0, 7) },
      production: { sha: main.object.sha.slice(0, 7) },
    };
  } catch { /* GitHub not configured — skip */ }

  return { devCount, qualityTRs, prodTRs, rollbacks, branches };
};

module.exports = {
  getStats, list, get, create, approve, update,
  promote, rollback, toggleScopeLock,
  addComment, addTestScenario, updateTestResult,
  getEnvironments,
};
