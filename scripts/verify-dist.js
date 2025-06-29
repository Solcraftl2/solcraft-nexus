import { access } from 'fs/promises';
import { constants } from 'fs';

async function verify() {
  try {
    await access('dist/index.html', constants.F_OK);
    console.log('dist/index.html found');
  } catch (err) {
    console.error('dist/index.html missing');
    process.exit(1);
  }
}

verify();
