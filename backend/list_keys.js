import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
console.log('Keys:', Object.keys(pdfModule));
for (const key of Object.keys(pdfModule).slice(0, 5)) {
    console.log(`${key}:`, typeof pdfModule[key]);
}
