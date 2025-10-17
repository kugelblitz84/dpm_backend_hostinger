#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../src/template');
const dest = path.resolve(__dirname, '../dist/template');

async function copy() {
  try {
    if (!fs.existsSync(src)) {
      console.log('[postbuild] src/template does not exist, skipping copy.');
      return;
    }
    await fs.promises.mkdir(dest, { recursive: true });
    // Use fs.cp if available (Node 16.7+), otherwise fallback to manual copy
    if (fs.promises && typeof fs.promises.cp === 'function') {
      await fs.promises.cp(src, dest, { recursive: true });
    } else {
      // simple recursive copy fallback
      const copyRecursive = async (srcDir, destDir) => {
        await fs.promises.mkdir(destDir, { recursive: true });
        const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
        for (const entry of entries) {
          const srcPath = path.join(srcDir, entry.name);
          const destPath = path.join(destDir, entry.name);
          if (entry.isDirectory()) {
            await copyRecursive(srcPath, destPath);
          } else {
            await fs.promises.copyFile(srcPath, destPath);
          }
        }
      };
      await copyRecursive(src, dest);
    }
    console.log('[postbuild] template copied to dist/template');
  } catch (err) {
    console.error('[postbuild] copy failed:', err);
    process.exit(1);
  }
}

copy();
