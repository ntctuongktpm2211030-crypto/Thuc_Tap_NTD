import { prisma } from '../db';

export async function checkVectorExtension(): Promise<boolean> {
  try {
    const res = await prisma.$queryRaw<any[]>`SELECT extname FROM pg_extension WHERE extname = 'vector'`;
    return res.length > 0;
  } catch (err) {
    console.error('[PgVector] Lỗi kiểm tra extension pgvector:', err);
    return false;
  }
}
