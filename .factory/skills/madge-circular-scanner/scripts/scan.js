const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../../../../');
const packageJsonPath = path.join(projectRoot, 'package.json');
const backupDir = path.join(__dirname, '.backup_files');

const lockFiles = ['bun.lockb', 'bun.lock', 'pnpm-lock.yaml', 'yarn.lock', 'package-lock.json'];
const filesToManage = ['package.json', ...lockFiles];

let originalFilesState = {};
let installedTemporarily = false;
let isCleaningUp = false;
let pm = 'npm';

// 1. Detect package manager
function detectPackageManager() {
  if (fs.existsSync(path.join(projectRoot, 'bun.lockb')) || fs.existsSync(path.join(projectRoot, 'bun.lock'))) return 'bun';
  if (fs.existsSync(path.join(projectRoot, 'pnpm-lock.yaml'))) return 'pnpm';
  if (fs.existsSync(path.join(projectRoot, 'yarn.lock'))) return 'yarn';
  return 'npm';
}

pm = detectPackageManager();

// 2. Check if madge is installed
let hasMadge = false;
try {
  require.resolve('madge');
  hasMadge = true;
} catch {
  hasMadge = false;
}

if (!hasMadge && fs.existsSync(packageJsonPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (allDeps['madge']) {
      hasMadge = true;
    }
  } catch {
    // Ignore JSON parse errors
  }
}

// 3. Backup and Install function
function backupFiles() {
  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    filesToManage.forEach(file => {
      const srcPath = path.join(projectRoot, file);
      const exists = fs.existsSync(srcPath);
      originalFilesState[file] = exists;
      if (exists) {
        const destPath = path.join(backupDir, file);
        fs.copyFileSync(srcPath, destPath);
      }
    });
  } catch (err) {
    console.error('[Scanner] Failed to backup files:', err.message);
  }
}

// Cleanup function
function cleanUpAndExit(exitCode) {
  if (isCleaningUp) {
    if (exitCode !== undefined) {
      process.exit(exitCode);
    }
    return;
  }
  isCleaningUp = true;

  if (installedTemporarily) {
    console.log(`[Scanner] Cleaning up. Uninstalling madge using ${pm}...`);
    try {
      let uninstallCmd = '';
      if (pm === 'bun') uninstallCmd = 'bun remove madge';
      else if (pm === 'pnpm') uninstallCmd = 'pnpm remove madge';
      else if (pm === 'yarn') uninstallCmd = 'yarn remove madge';
      else uninstallCmd = 'npm uninstall madge';

      execSync(uninstallCmd, { cwd: projectRoot, stdio: 'ignore' });
    } catch (err) {
      console.error('[Scanner] Failed to uninstall madge:', err.message);
    }

    console.log('[Scanner] Restoring package configurations...');
    filesToManage.forEach(file => {
      const destPath = path.join(projectRoot, file);
      const backupPath = path.join(backupDir, file);
      const existedBefore = originalFilesState[file];

      if (existedBefore && fs.existsSync(backupPath)) {
        try {
          fs.copyFileSync(backupPath, destPath);
        } catch (_e) {
          console.error(`[Scanner] Failed to restore ${file} from backup:`, _e.message);
        }
      } else if (!existedBefore && fs.existsSync(destPath)) {
        try {
          fs.unlinkSync(destPath);
        } catch (_e) {
          console.error(`[Scanner] Failed to delete temporary file ${file}:`, _e.message);
        }
      }
    });

    // Remove backup files
    try {
      if (fs.existsSync(backupDir)) {
        fs.readdirSync(backupDir).forEach(file => {
          fs.unlinkSync(path.join(backupDir, file));
        });
        fs.rmdirSync(backupDir);
      }
    } catch (_e) {
      console.error('[Scanner] Failed to remove backup directory:', _e.message);
    }

    // Git checkout to fully restore from repo
    try {
      const filesToGitCheckout = filesToManage.filter(file => originalFilesState[file]);
      if (filesToGitCheckout.length > 0) {
        filesToGitCheckout.forEach(file => {
          try {
            execSync(`git checkout -- "${file}"`, { cwd: projectRoot, stdio: 'ignore' });
          } catch {
            // Ignore if file is untracked in Git
          }
        });
      }
      console.log('[Scanner] Workspace cleaned and restored successfully.');
    } catch (err) {
      console.error('[Scanner] Failed during git checkout restore:', err.message);
    }
  }

  if (exitCode !== undefined) {
    process.exit(exitCode);
  }
}

// Register process hooks
process.on('SIGINT', () => {
  console.log('\n[Scanner] Interrupted (SIGINT). Cleaning up...');
  cleanUpAndExit(130);
});

process.on('SIGTERM', () => {
  console.log('\n[Scanner] Terminated (SIGTERM). Cleaning up...');
  cleanUpAndExit(143);
});

process.on('uncaughtException', (err) => {
  console.error('\n[Scanner] Uncaught Exception:', err);
  cleanUpAndExit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n[Scanner] Unhandled Rejection at:', promise, 'reason:', reason);
  cleanUpAndExit(1);
});

// Run script logic
if (!hasMadge) {
  console.log(`[Scanner] Madge not found. Installing temporarily using ${pm}...`);
  try {
    backupFiles();
    
    let installCmd = '';
    if (pm === 'bun') installCmd = 'bun add -d madge';
    else if (pm === 'pnpm') installCmd = 'pnpm add -D madge';
    else if (pm === 'yarn') installCmd = 'yarn add -D madge';
    else installCmd = 'npm install --save-dev madge';

    execSync(installCmd, { cwd: projectRoot, stdio: 'ignore' });
    installedTemporarily = true;
    console.log('[Scanner] Madge installed successfully.');
  } catch (err) {
    console.error('[Scanner] Failed to install madge temporarily:', err.message);
    cleanUpAndExit(1);
  }
}

// Execute scanning
try {
  const madge = require('madge');
  const appDir = path.join(projectRoot, 'app');
  const entrypoints = [];

  function getEntrypoints(dir) {
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      return;
    }
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.next' && file !== 'convex') {
          getEntrypoints(filePath);
        }
      } else {
        if (file === 'page.tsx' || file === 'layout.tsx' || file === 'route.ts') {
          entrypoints.push(filePath);
        }
      }
    });
  }

  if (fs.existsSync(appDir)) {
    getEntrypoints(appDir);
  }

  if (entrypoints.length === 0) {
    console.log('[Scanner] No entrypoints found in app/ directory.');
    cleanUpAndExit(0);
  }

  console.log(`[Scanner] Found ${entrypoints.length} entrypoints. Analyzing dependency graph...`);

  madge(entrypoints, {
    extensions: ['ts', 'tsx'],
    tsConfig: fs.existsSync(path.join(projectRoot, 'tsconfig.json')) ? path.join(projectRoot, 'tsconfig.json') : undefined,
    excludeRegExp: [
      /convex\//,
      /node_modules/
    ]
  }).then((res) => {
    const circular = res.circular();
    if (circular.length === 0) {
      console.log('\n\x1b[32m√ No circular dependencies found (excluding convex)!\x1b[0m\n');
    } else {
      console.log(`\n\x1b[31mFound ${circular.length} circular dependencies:\x1b[0m`);
      circular.forEach((pathArr, index) => {
        console.log(`${index + 1}) ${pathArr.join(' > ')}`);
      });
      console.log('');
    }
    cleanUpAndExit(circular.length > 0 ? 1 : 0);
  }).catch((err) => {
    console.error('[Scanner] Error running madge:', err);
    cleanUpAndExit(1);
  });

} catch (err) {
  console.error('[Scanner] System error:', err.message);
  cleanUpAndExit(1);
}
