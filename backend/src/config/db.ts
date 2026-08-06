import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

export async function withDbRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isConnError =
        err?.message?.includes('closed the connection') ||
        err?.message?.includes("Can't reach database server") ||
        err?.code === 'P1001' ||
        err?.code === 'P1017';
      if (isConnError && i < retries - 1) {
        await new Promise(r => setTimeout(r, 500));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}

