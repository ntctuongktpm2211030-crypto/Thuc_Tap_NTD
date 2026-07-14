import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const logFile = path.resolve(__dirname, '../backend_console.log');
const log = (msg: string) => {
  const line = `[DB-Sync] ${msg}\n`;
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {}
  // Also write to stdout so it appears in normal terminal
  process.stdout.write(line);
};

try {
  log('🔄 Running Prisma db push to sync database...');
  const out1 = execSync('npx prisma db push', { encoding: 'utf-8' });
  log(`Output:\n${out1}`);
  
  log('🔄 Running Prisma generate to rebuild client...');
  const out2 = execSync('npx prisma generate', { encoding: 'utf-8' });
  log(`Output:\n${out2}`);
  
  log('✅ Completed db push and generate successfully!');
} catch (err: any) {
  log(`❌ Failed with error: ${err?.message || err}`);
  if (err?.stdout) log(`Stdout:\n${err.stdout}`);
  if (err?.stderr) log(`Stderr:\n${err.stderr}`);
}
