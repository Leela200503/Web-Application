import { promises as fs } from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
const dataFilePath = path.join(process.cwd(), 'data', 'notices.json');

function getMemoryStore() {
  if (!globalForPrisma.__noticeStore) {
    globalForPrisma.__noticeStore = [];
  }
  return globalForPrisma.__noticeStore;
}

async function readFallbackNotices() {
  const memoryStore = getMemoryStore();
  if (memoryStore.length > 0) {
    return memoryStore;
  }

  try {
    const raw = await fs.readFile(dataFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    globalForPrisma.__noticeStore = parsed;
    return parsed;
  } catch {
    return [];
  }
}

async function writeFallbackNotices(notices) {
  getMemoryStore().splice(0, getMemoryStore().length, ...notices);

  try {
    await fs.mkdir(path.dirname(dataFilePath), { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify(notices, null, 2));
  } catch {
    // Ignore file-system write failures in serverless environments.
  }
}

function createFallbackPrisma() {
  return {
    notice: {
      async findMany({ orderBy } = {}) {
        const notices = await readFallbackNotices();
        const sorted = [...notices].sort((a, b) => {
          if (a.priority === b.priority) {
            return new Date(b.publishDate) - new Date(a.publishDate);
          }
          return a.priority === 'Urgent' ? -1 : 1;
        });
        return sorted;
      },
      async findUnique({ where }) {
        const notices = await readFallbackNotices();
        return notices.find((notice) => notice.id === where.id) || null;
      },
      async create({ data }) {
        const notices = await readFallbackNotices();
        const notice = {
          id: Date.now(),
          ...data,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        notices.push(notice);
        await writeFallbackNotices(notices);
        return notice;
      },
      async update({ where, data }) {
        const notices = await readFallbackNotices();
        const index = notices.findIndex((notice) => notice.id === where.id);
        if (index === -1) {
          throw new Error('Notice not found');
        }
        notices[index] = {
          ...notices[index],
          ...data,
          updatedAt: new Date().toISOString(),
        };
        await writeFallbackNotices(notices);
        return notices[index];
      },
      async delete({ where }) {
        const notices = await readFallbackNotices();
        const index = notices.findIndex((notice) => notice.id === where.id);
        if (index === -1) {
          throw new Error('Notice not found');
        }
        notices.splice(index, 1);
        await writeFallbackNotices(notices);
        return { success: true };
      },
    },
  };
}

let prisma;

try {
  if (process.env.DATABASE_URL) {
    prisma = globalForPrisma.prisma || new PrismaClient();
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
  } else {
    prisma = createFallbackPrisma();
  }
} catch {
  prisma = createFallbackPrisma();
}

export default prisma;
