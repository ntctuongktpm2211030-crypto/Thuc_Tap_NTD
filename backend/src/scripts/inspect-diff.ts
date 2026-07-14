import { execSync } from 'child_process';

try {
  // Get diff showing only address changes
  const diff = execSync('git diff -U0 -- "*json"', { encoding: 'utf-8' });
  console.log("Diff Output length:", diff.length);
  // Let's print the first 1000 characters to inspect
  console.log(diff.substring(0, 2000));
} catch (e: any) {
  console.error("Error:", e.message);
}
