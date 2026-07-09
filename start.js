const { spawn } = require('child_process');
const path = require('path');

function runService(name, command, args, cwd, colorCode) {
  const child = spawn(command, args, {
    cwd: path.resolve(__dirname, cwd),
    shell: true
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) {
        console.log(`\x1b[${colorCode}m[${name}]\x1b[0m ${line}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) {
        console.error(`\x1b[${colorCode}m[${name} ERR]\x1b[0m ${line}`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`\x1b[${colorCode}m[${name}]\x1b[0m exited with code ${code}`);
  });

  return child;
}

console.log('========================================================');
WriteColor('=== KHOI CHAY SONG SONG 3 DICH VU TREN CONSOLE NAY ===', '35');
console.log('========================================================\n');
console.log('[*] Nhan Ctrl+C de dung tat ca cac dich vu cung luc.\n');

// 36 = Cyan, 32 = Green, 33 = Yellow
const backend = runService('Backend', 'npm', ['run', 'dev'], 'backend', '36');
const frontend = runService('Frontend', 'npm', ['run', 'dev'], 'frontend', '32');
const aiService = runService('AI-Service', path.join('venv', 'Scripts', 'python'), ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000', '--reload', '--reload-dir', 'app'], 'ai-service', '33');

function WriteColor(text, colorCode) {
  console.log(`\x1b[${colorCode}m${text}\x1b[0m`);
}

process.on('SIGINT', () => {
  console.log('\n[*] Dang dung tat ca cac dich vu...');
  try { backend.kill(); } catch(e) {}
  try { frontend.kill(); } catch(e) {}
  try { aiService.kill(); } catch(e) {}
  process.exit();
});
