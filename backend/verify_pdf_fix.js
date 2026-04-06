import fs from 'fs';
import { geminiService } from './src/services/geminiService.ts';

// This is a minimal valid PDF-like buffer for testing the parser initialization
// Even a blank buffer might throw a FormatError, but we want to see if the function/class is found.
const mockBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Count 1\n/Kids [3 0 R]\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000139 00000 n \n0000000280 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n374\n%%EOF');

async function test() {
    try {
        console.log('Testing PDF summarization...');
        // We'll call summarizePDF, but expect it to fail at generateContent or similar if model isn't active
        // But the first step is pdf parsing.
        
        // Let's just test the PDF parsing part directly first
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        const { PDFParse } = require('pdf-parse');
        
        console.log('PDFParse found:', typeof PDFParse);
        const parser = new PDFParse({ data: mockBuffer });
        const result = await parser.getText();
        console.log('Successfully parsed PDF text:', result.text);
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

test();
