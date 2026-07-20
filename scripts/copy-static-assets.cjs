'use strict'

const fs = require('node:fs')
const path = require('node:path')

const root = path.join(__dirname, '..')
const srcDir = path.join(root, 'src', 'assets')
const destDir = path.join(root, 'dist', 'assets')

const copyRecursive = (from, to) => {
  if (!fs.existsSync(from)) {
    return
  }
  fs.mkdirSync(to, { recursive: true })
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name)
    const destPath = path.join(to, entry.name)
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

if (!fs.existsSync(srcDir)) {
  console.warn('copy-static-assets: no src/assets directory, skipping')
  process.exit(0)
}

copyRecursive(srcDir, destDir)
console.log('copy-static-assets: copied to', destDir)
