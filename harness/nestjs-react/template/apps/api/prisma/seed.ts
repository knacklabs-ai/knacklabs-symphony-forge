import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a seed user for local development
  const seedUser = await prisma.user.upsert({
    where: { cognitoId: 'dev-seed-user-cognito-id' },
    update: {},
    create: {
      cognitoId: 'dev-seed-user-cognito-id',
      email: 'dev@{{PROJECT_NAME}}.local',
    },
  });

  console.log(`  ✓ Created seed user: ${seedUser.email} (${seedUser.id})`);
  console.log('✅ Seed complete');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
