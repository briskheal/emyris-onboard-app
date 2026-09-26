const { execSync } = require('child_process');
try {
  execSync('git add routes/admin.js xla-frontend/src xla-frontend/dist -f', { stdio: 'inherit' });
  execSync('git commit -m "feat(targets): build and deploy Excel target upload logic"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
  console.log('Successfully deployed.');
} catch (e) {
  console.error('Failed to deploy');
  process.exit(1);
}
