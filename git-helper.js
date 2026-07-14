const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const action = process.argv[2] || 'status';

if (action === 'status') {
  try {
    console.log('=== FILE STATUS ===');
    const status = execSync('git status -s backend/src/config/destinations/', { encoding: 'utf8' });
    console.log(status || 'No changed destination files.');
  } catch (e) {
    console.error('Error running git:', e.message);
  }
} else if (action === 'restore') {
  try {
    console.log('=== RESTORING ORIGINAL JSON FILES FROM GIT ===');
    execSync('git checkout -- backend/src/config/destinations/*.json', { stdio: 'inherit' });
    console.log('✅ Restored all destination JSON files successfully!');
  } catch (e) {
    console.error('Error restoring files:', e.message);
  }
}
