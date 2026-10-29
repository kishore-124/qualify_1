import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma's Rust-free client talks to Postgres through the official `pg` driver adapter.
// No native query-engine binary is required, so this deploys anywhere (Vercel, Docker, VPS).
const globalForPrisma = globalThis;

function createClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.__prisma || createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.__prisma = prisma;

export default prisma;
