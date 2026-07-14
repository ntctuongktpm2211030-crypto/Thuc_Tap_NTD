import { execSync } from 'child_process';

try {
  const status = execSync('git status -s', { encoding: 'utf-8' });
  console.log("Git Status:\n", status);
} catch (e: any) {
  console.error("Git error:", e.message);
}
