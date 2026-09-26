const { execSync } = require('child_process');
try {
  execSync('npm run build', { cwd: 'xla-frontend', stdio: 'inherit' });
  execSync('git add xla-frontend/src xla-frontend/dist -f', { stdio: 'inherit' });
  execSync('git commit -m "style(create_user): redesign create profile page to use flat, edge-to-edge layout like target grids"', { stdio: 'inherit' });
  execSync('git push', { stdio: 'inherit' });
  console.log('Successfully built and deployed.');
} catch (e) {
  console.error('Failed to build/deploy');
  process.exit(1);
}
