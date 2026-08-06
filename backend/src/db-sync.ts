import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const logFile = path.resolve(__dirname, '../backend_console.log');
const log = (msg: string) => {
  const line = `[DB-Sync] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {}
  process.stdout.write(line);
};

// Only run heavy db push when explicitly requested to prevent slow server startup
if (process.env.RUN_DB_PUSH === 'true') {
  try {
    log('🔄 Running Prisma db push to sync database...');
    const out1 = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf-8' });
    log(`Output:\n${out1}`);
    
    log('🔄 Running Prisma generate to rebuild client...');
    const out2 = execSync('npx prisma generate', { encoding: 'utf-8' });
    log(`Output:\n${out2}`);
    
    log('✅ Completed db push and generate successfully!');
  } catch (err: any) {
    log(`❌ Failed with error: ${err?.message || err}`);
  }
} else {
  log('⚡ Instant DB boot ready (DB push bypassed for high performance).');
}
