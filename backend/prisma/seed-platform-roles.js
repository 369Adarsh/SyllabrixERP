const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Wings — each maps to a group of Nerve Center pages
const WINGS = ['COMMAND', 'GROWTH', 'TENANTS', 'PLATFORM', 'OPERATIONS', 'INTELLIGENCE', 'ADMIN'];

const none = { C: false, R: false, U: false, D: false };
const r    = { C: false, R: true,  U: false, D: false };
const ru   = { C: false, R: true,  U: true,  D: false };
const cru  = { C: true,  R: true,  U: true,  D: false };
const crud = { C: true,  R: true,  U: true,  D: true  };

const BUILT_IN_ROLES = [
  {
    name: 'SUPER',
    label: 'Super Admin',
    description: 'Full access to everything including admin management and API keys. Cannot be assigned to multiple people.',
    isBuiltIn: true,
    permissions: {
      COMMAND:      crud,
      GROWTH:       crud,
      TENANTS:      crud,
      PLATFORM:     crud,
      OPERATIONS:   crud,
      INTELLIGENCE: crud,
      ADMIN:        crud,
    },
  },
  {
    name: 'ADMIN',
    label: 'Operations Admin',
    description: 'Full operational access. Cannot manage other admin accounts or API keys.',
    isBuiltIn: true,
    permissions: {
      COMMAND:      crud,
      GROWTH:       crud,
      TENANTS:      crud,
      PLATFORM:     crud,
      OPERATIONS:   crud,
      INTELLIGENCE: { C: true, R: true, U: false, D: false },
      ADMIN:        none,
    },
  },
  {
    name: 'SUPPORT',
    label: 'Support Agent',
    description: 'Handles tenant queries, bug reports, and announcements. Read-only on financials.',
    isBuiltIn: true,
    permissions: {
      COMMAND:      r,
      GROWTH:       r,
      TENANTS:      ru,
      PLATFORM:     none,
      OPERATIONS:   ru,
      INTELLIGENCE: r,
      ADMIN:        none,
    },
  },
  {
    name: 'COMPLIANCE',
    label: 'Compliance Officer',
    description: 'Read-only access to compliance, KYC, audit logs, and tenant data.',
    isBuiltIn: true,
    permissions: {
      COMMAND:      r,
      GROWTH:       none,
      TENANTS:      r,
      PLATFORM:     none,
      OPERATIONS:   r,
      INTELLIGENCE: r,
      ADMIN:        none,
    },
  },
  {
    name: 'ANALYST',
    label: 'Business Analyst',
    description: 'Read-only access to revenue, analytics, and platform metrics.',
    isBuiltIn: true,
    permissions: {
      COMMAND:      r,
      GROWTH:       r,
      TENANTS:      none,
      PLATFORM:     none,
      OPERATIONS:   none,
      INTELLIGENCE: r,
      ADMIN:        none,
    },
  },
  {
    name: 'DEVELOPER',
    label: 'Developer',
    description: 'Full access to platform config, feature flags, and dev tools. No tenant or financial data.',
    isBuiltIn: true,
    permissions: {
      COMMAND:      r,
      GROWTH:       none,
      TENANTS:      none,
      PLATFORM:     crud,
      OPERATIONS:   cru,
      INTELLIGENCE: r,
      ADMIN:        none,
    },
  },
];

async function main() {
  console.log('Seeding built-in platform roles...');
  for (const role of BUILT_IN_ROLES) {
    await prisma.platformRole.upsert({
      where:  { name: role.name },
      update: { label: role.label, description: role.description, permissions: role.permissions },
      create: role,
    });
    console.log(`  ✓ ${role.name} — ${role.label}`);
  }

  // Assign platformRoleId to existing SuperAdmins based on their role enum
  const admins = await prisma.superAdmin.findMany({ where: { platformRoleId: null } });
  const roleMap = Object.fromEntries(
    (await prisma.platformRole.findMany()).map((r) => [r.name, r.id])
  );
  for (const admin of admins) {
    const roleId = roleMap[admin.role];
    if (roleId) {
      await prisma.superAdmin.update({ where: { id: admin.id }, data: { platformRoleId: roleId } });
      console.log(`  ✓ Assigned ${admin.role} role to ${admin.name}`);
    }
  }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
