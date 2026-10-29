/* eslint-disable no-console */
// Loads the demo data only when the database has no users yet, so restarting the
// containers never wipes real data. Set SEED_DEMO_DATA=false to skip it entirely.
const { execFileSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
  if (String(process.env.SEED_DEMO_DATA || 'true').toLowerCase() === 'false') {
    console.log('SEED_DEMO_DATA=false — skipping demo data.');
    return;
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const users = await prisma.user.count();
  await prisma.$disconnect();
  if (users > 0) {
    console.log(`Database already has ${users} users — leaving data as it is.`);
    return;
  }
  console.log('Empty database — loading demo data…');
  execFileSync(process.execPath, [path.join(__dirname, 'seed.js')], { stdio: 'inherit' });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
