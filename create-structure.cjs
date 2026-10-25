// Safe to run repeatedly: create feature folders without overwriting source files.
const { mkdirSync } = require('node:fs');
const features = ['auth', 'dashboard', 'standup', 'github', 'weekly', 'settings'];
const frontend = [
  'assets/images',
  'assets/icons',
  'assets/fonts',
  'assets/animations',
  'components/ui',
  'components/Button',
  'components/Card',
  'components/Header',
  'components/Sidebar',
  'components/Loader',
  'components/Modal',
  'navigation',
  'services/api',
  'services/storage',
  'hooks',
  'utils',
  'constants',
  'theme',
  'store',
  'types',
];
const backend = ['config', 'middleware', 'routes', 'jobs', 'utils', 'types'];
for (const feature of features) {
  for (const folder of ['api', 'hooks', 'components', 'screens', 'schemas'])
    frontend.push(`features/${feature}/${folder}`);
  for (const folder of ['controllers', 'routes', 'services', 'schemas'])
    backend.push(`modules/${feature}/${folder}`);
}
for (const folder of frontend) mkdirSync(`frontend/src/${folder}`, { recursive: true });
for (const folder of backend) mkdirSync(`backend/src/${folder}`, { recursive: true });
console.log('Standup Auto feature folders are ready.');
