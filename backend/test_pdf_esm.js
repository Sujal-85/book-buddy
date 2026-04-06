import pdf from 'pdf-parse';
console.log('Default Export Type:', typeof pdf);
console.log('Default Export Value:', pdf);

import * as pdfAll from 'pdf-parse';
console.log('All Export Keys:', Object.keys(pdfAll));
