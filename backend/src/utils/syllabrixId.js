/**
 * Syllabrix Universal ID Generator
 *
 * Format: SYL + 5-digit zero-padded sequential number
 * Examples: SYL00001, SYL00042, SYL00199
 *
 * Single global pool — tenants and branches share the same counter.
 * The ID itself is opaque; entity type is determined by which table it lives in.
 *
 * Race-safety: reads max across both tables, then creates with unique constraint
 * as the final guard. Caller should catch P2002 and retry if needed.
 */

const prisma = require('../config/prisma');

const RE = /^SYL(\d{5})$/;

const currentMax = async () => {
  const [tenants, branches, users] = await Promise.all([
    prisma.tenant.findMany({
      where: { syllabrixId: { not: null } },
      select: { syllabrixId: true },
    }),
    prisma.branch.findMany({
      where: { syllabrixId: { not: null } },
      select: { syllabrixId: true },
    }),
    prisma.user.findMany({
      where: { syllabrixId: { not: null } },
      select: { syllabrixId: true },
    }),
  ]);

  let max = 0;
  for (const { syllabrixId } of [...tenants, ...branches, ...users]) {
    const m = RE.exec(syllabrixId);
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > max) max = n;
    }
  }
  return max;
};

const nextSyllabrixId = async () => {
  const max = await currentMax();
  return `SYL${String(max + 1).padStart(5, '0')}`;
};

// Reserve n consecutive IDs in a single DB read — avoids collision when creating
// multiple entities at once (e.g. tenant + owner user on registration).
const nextNSyllabrixIds = async (n) => {
  const max = await currentMax();
  return Array.from({ length: n }, (_, i) => `SYL${String(max + 1 + i).padStart(5, '0')}`);
};

// Branch ID: extension of the parent tenant's SYL ID.
// Format: SYL00023-MAIN  (tenant syllabrixId + dash + 4-char uppercase branch code)
const generateBranchId = (tenantSyllabrixId, branchCode) =>
  `${tenantSyllabrixId}-${branchCode.toUpperCase().slice(0, 4)}`;

// Staff / Manager ID: branch-scoped 8-char alphanumeric.
// Format: MAIN1001  (4-char branch code + 4-digit non-zero-leading sequential)
// Sequence starts at 1001 so the numeric part is always 4 digits with no leading zero.
// Uniqueness: scans ALL users globally to find the max existing sequence for this prefix.
const generateStaffId = async (branchCode) => {
  const prefix = branchCode.toUpperCase().slice(0, 4);
  const reStaff = new RegExp(`^${prefix}(\\d{4})$`);
  const existing = await prisma.user.findMany({
    where: { syllabrixId: { startsWith: prefix } },
    select: { syllabrixId: true },
  });
  let max = 1000; // start from 1001 — 4 digits, never zero-leading
  for (const { syllabrixId } of existing) {
    const m = reStaff.exec(syllabrixId);
    if (m) { const n = parseInt(m[1], 10); if (n > max) max = n; }
  }
  return `${prefix}${String(max + 1)}`; // e.g. MAIN1001, STRD1002
};

module.exports = { nextSyllabrixId, nextNSyllabrixIds, generateBranchId, generateStaffId };
