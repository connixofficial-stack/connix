const { execSync } = require('child_process');

try {
  // Bật lại tính năng enableShopConfigAdvanced thành true
  const result = execSync('npx convex run admin/modules:toggleModuleFeature "{\\"moduleKey\\":\\"settings\\",\\"featureKey\\":\\"enableShopConfigAdvanced\\",\\"enabled\\":true}"', { encoding: 'utf8' });
  console.log('Result:', result);
} catch (err) {
  console.error('Error:', err.message);
  if (err.stdout) console.log('Stdout:', err.stdout);
  if (err.stderr) console.error('Stderr:', err.stderr);
}


