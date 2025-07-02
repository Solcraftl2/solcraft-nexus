#!/usr/bin/env node

/**
 * Script per aggiornare URL da Vercel a Netlify
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione URL
const URL_MAPPINGS = [
  {
    old: 'https://solcraft-nexus-production.netlify.app',
    new: 'https://solcraft-nexus-production.netlify.app'
  },
  {
    old: 'https://solcraft-nexus-production.netlify.app',
    new: 'https://solcraft-nexus-production.netlify.app'
  },
  {
    old: 'solcraft-nexus-production.netlify.app',
    new: 'solcraft-nexus-production.netlify.app'
  },
  {
    old: 'solcraft-nexus-production.netlify.app',
    new: 'solcraft-nexus-production.netlify.app'
  }
];

const CONFIG = {
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.env'],
  excludeDirs: ['node_modules', '.git', 'dist', 'build'],
  excludeFiles: ['package-lock.json'] // Escludiamo package-lock.json
};

/**
 * Trova tutti i file da processare
 */
function findFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !CONFIG.excludeDirs.includes(item)) {
      findFiles(fullPath, files);
    } else if (stat.isFile() && 
               CONFIG.extensions.some(ext => item.endsWith(ext)) &&
               !CONFIG.excludeFiles.includes(item)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Aggiorna URL in un file
 */
function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  for (const { old, new: newUrl } of URL_MAPPINGS) {
    if (content.includes(old)) {
      content = content.replaceAll(old, newUrl);
      modified = true;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Aggiornato: ${filePath}`);
  }
  
  return modified;
}

/**
 * Funzione principale
 */
function main() {
  console.log('🔄 Aggiornamento URL da Vercel a Netlify...\n');
  
  const projectRoot = process.cwd();
  const files = findFiles(projectRoot);
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  
  for (const file of files) {
    totalFiles++;
    const modified = updateFile(file);
    if (modified) modifiedFiles++;
  }
  
  console.log('\n📊 Statistiche aggiornamento URL:');
  console.log(`   File analizzati: ${totalFiles}`);
  console.log(`   File modificati: ${modifiedFiles}`);
  
  if (modifiedFiles > 0) {
    console.log('\n✅ Aggiornamento URL completato con successo!');
  } else {
    console.log('\n✨ Nessun URL da aggiornare trovato!');
  }
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { updateFile, findFiles };

