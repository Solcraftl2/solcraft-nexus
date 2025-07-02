#!/usr/bin/env node

/**
 * Script di pulizia console.log per SolCraft Nexus
 * Sostituisce console.log con il sistema di logging strutturato
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const CONFIG = {
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  excludeDirs: ['node_modules', '.git', 'dist', 'build'],
  loggerImport: "import { logger } from '../utils/logger.js';",
  replacements: [
    {
      pattern: /console\.log\((.*?)\);?/g,
      replacement: 'logger.info($1);'
    },
    {
      pattern: /console\.error\((.*?)\);?/g,
      replacement: 'logger.error($1);'
    },
    {
      pattern: /console\.warn\((.*?)\);?/g,
      replacement: 'logger.warn($1);'
    },
    {
      pattern: /console\.debug\((.*?)\);?/g,
      replacement: 'logger.debug($1);'
    }
  ]
};

/**
 * Trova tutti i file JavaScript/TypeScript
 */
function findJSFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !CONFIG.excludeDirs.includes(item)) {
      findJSFiles(fullPath, files);
    } else if (stat.isFile() && CONFIG.extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Pulisce i console.log da un file
 */
function cleanupFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let hasConsole = false;
  
  // Verifica se il file contiene console.*
  if (/console\.(log|error|warn|debug)/.test(content)) {
    hasConsole = true;
    
    // Applica le sostituzioni
    for (const { pattern, replacement } of CONFIG.replacements) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    }
    
    // Aggiungi import del logger se necessario e non già presente
    if (modified && !content.includes("from '../utils/logger.js'") && !content.includes("from './utils/logger.js'")) {
      // Determina il path relativo corretto
      const relativePath = path.relative(path.dirname(filePath), path.join(__dirname, '../netlify/functions/utils/logger.js'));
      const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
      
      content = `import { logger } from '${importPath}';\n${content}`;
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    logger.info(`✅ Pulito: ${filePath}`);
  }
  
  return { modified, hasConsole };
}

/**
 * Funzione principale
 */
function main() {
  logger.info('🧹 Avvio pulizia console.log...\n');
  
  const projectRoot = process.cwd();
  const files = findJSFiles(projectRoot);
  
  let totalFiles = 0;
  let modifiedFiles = 0;
  let filesWithConsole = 0;
  
  for (const file of files) {
    totalFiles++;
    const { modified, hasConsole } = cleanupFile(file);
    
    if (hasConsole) filesWithConsole++;
    if (modified) modifiedFiles++;
  }
  
  logger.info('\n📊 Statistiche pulizia:');
  logger.info(`   File analizzati: ${totalFiles}`);
  logger.info(`   File con console.*: ${filesWithConsole}`);
  logger.info(`   File modificati: ${modifiedFiles}`);
  
  if (modifiedFiles > 0) {
    logger.info('\n✅ Pulizia completata con successo!');
    logger.info('💡 Ricorda di verificare che il logger sia importato correttamente.');
  } else {
    logger.info('\n✨ Nessun file da pulire trovato!');
  }
}

// Esegui solo se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { cleanupFile, findJSFiles };

