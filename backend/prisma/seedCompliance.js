/**
 * Syllabrix — Compliance Seed
 * Seeds realistic compliance records for all existing tenants.
 * Run: node prisma/seedCompliance.js
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const PROFILES = [
  // Fully verified, low risk — model tenant
  { kycStatus: 'VERIFIED',     riskLevel: 'LOW',      gstVerified: true,  panVerified: true,  flags: [],                                    notes: 'All documents verified. GST and PAN confirmed with GSTIN portal.' },
  // Submitted docs, under review
  { kycStatus: 'UNDER_REVIEW', riskLevel: 'LOW',      gstVerified: false, panVerified: true,  flags: [],                                    notes: 'PAN verified. GST certificate under review.' },
  // KYC pending — just signed up
  { kycStatus: 'PENDING',      riskLevel: 'LOW',      gstVerified: false, panVerified: false, flags: [],                                    notes: '' },
  // Submitted but missing GST
  { kycStatus: 'SUBMITTED',    riskLevel: 'MEDIUM',   gstVerified: false, panVerified: true,  flags: ['MISSING_GST'],                       notes: 'GST certificate not submitted. Follow-up required.' },
  // High risk — suspicious activity flagged
  { kycStatus: 'VERIFIED',     riskLevel: 'HIGH',     gstVerified: true,  panVerified: true,  flags: ['SUSPICIOUS_ACTIVITY', 'HIGH_CHARGEBACK'], notes: 'Multiple high-value transactions flagged by fraud engine. Under investigation.' },
  // Rejected KYC — documents invalid
  { kycStatus: 'REJECTED',     riskLevel: 'HIGH',     gstVerified: false, panVerified: false, flags: ['MISSING_PAN', 'UNVERIFIED_DOCS'],    notes: 'PAN card image blurry and unreadable. Resubmission requested via email on 2025-03-10.' },
  // High risk — multiple flags
  { kycStatus: 'SUBMITTED',    riskLevel: 'HIGH',     gstVerified: false, panVerified: false, flags: ['SUSPICIOUS_ACTIVITY', 'PENDING_TDS', 'MISSING_GST'], notes: 'TDS dues outstanding since Q3. Escalated to compliance team.' },
  // Verified, medium risk with a flag
  { kycStatus: 'VERIFIED',     riskLevel: 'MEDIUM',   gstVerified: true,  panVerified: true,  flags: ['PENDING_TDS'],                       notes: 'TDS filing for FY 2024-25 not completed. Reminder sent.' },
  // Pending — new signup
  { kycStatus: 'PENDING',      riskLevel: 'LOW',      gstVerified: false, panVerified: false, flags: [],                                    notes: 'New tenant. KYC documents not yet submitted.' },
  // Under review, medium risk
  { kycStatus: 'UNDER_REVIEW', riskLevel: 'MEDIUM',   gstVerified: true,  panVerified: false, flags: ['MISSING_PAN'],                       notes: 'GST verified. PAN not submitted.' },
  // Verified, low risk
  { kycStatus: 'VERIFIED',     riskLevel: 'LOW',      gstVerified: true,  panVerified: true,  flags: [],                                    notes: 'Clean record. Regular filer.' },
];

async function main() {
  console.log('\n🔍 Fetching all tenants…');
  const tenants = await prisma.tenant.findMany({ select: { id: true, name: true, email: true } });

  if (tenants.length === 0) {
    console.log('⚠️  No tenants found. Run `node prisma/seed.js` first.');
    return;
  }

  console.log(`📋 Found ${tenants.length} tenant(s). Seeding compliance records…\n`);

  for (let i = 0; i < tenants.length; i++) {
    const tenant = tenants[i];
    const profile = PROFILES[i % PROFILES.length];

    await prisma.complianceRecord.upsert({
      where: { tenantId: tenant.id },
      update: {
        kycStatus:   profile.kycStatus,
        riskLevel:   profile.riskLevel,
        gstVerified: profile.gstVerified,
        panVerified: profile.panVerified,
        flags:       profile.flags,
        notes:       profile.notes,
        lastReviewed: profile.kycStatus !== 'PENDING' ? new Date() : null,
        reviewedBy:   profile.kycStatus !== 'PENDING' ? 'Syllabrix Admin' : null,
      },
      create: {
        tenantId:    tenant.id,
        kycStatus:   profile.kycStatus,
        riskLevel:   profile.riskLevel,
        gstVerified: profile.gstVerified,
        panVerified: profile.panVerified,
        flags:       profile.flags,
        notes:       profile.notes,
        lastReviewed: profile.kycStatus !== 'PENDING' ? new Date() : null,
        reviewedBy:   profile.kycStatus !== 'PENDING' ? 'Syllabrix Admin' : null,
      },
    });

    const icon = { LOW: '🟢', MEDIUM: '🟡', HIGH: '🔴' }[profile.riskLevel];
    const flagStr = profile.flags.length ? ` [${profile.flags.join(', ')}]` : '';
    console.log(`  ${icon} ${tenant.name.padEnd(30)} ${profile.kycStatus.padEnd(14)} ${profile.riskLevel}${flagStr}`);
  }

  console.log('\n✅ Compliance records seeded successfully!\n');

  // Print summary
  const [total, verified, pending, highRisk, flagged] = await Promise.all([
    prisma.complianceRecord.count(),
    prisma.complianceRecord.count({ where: { kycStatus: 'VERIFIED' } }),
    prisma.complianceRecord.count({ where: { kycStatus: { in: ['PENDING', 'SUBMITTED', 'UNDER_REVIEW'] } } }),
    prisma.complianceRecord.count({ where: { riskLevel: 'HIGH' } }),
    prisma.complianceRecord.count({ where: { flags: { isEmpty: false } } }),
  ]);

  console.log('📊 Summary:');
  console.log(`   Total records : ${total}`);
  console.log(`   KYC Verified  : ${verified}`);
  console.log(`   KYC Pending   : ${pending}`);
  console.log(`   High Risk     : ${highRisk}`);
  console.log(`   Flagged       : ${flagged}\n`);
}

main()
  .catch((e) => { console.error('Compliance seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
