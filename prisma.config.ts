import { defineConfig } from 'prisma/config';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  earlyAccess: true,
  datasource: {
    // DIRECT_URL is the non-pooled Neon connection — required for migrate advisory locking
    // DATABASE_URL is the pooled connection — used by the runtime adapter
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  },
});
