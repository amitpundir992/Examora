import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Configure pdfjs worker
if (typeof window === 'undefined') {
  // Server-side: use file:// URL to the public directory
  const publicDir = join(process.cwd(), 'public');
  const workerUrl = `file://${publicDir.replace(/\\/g, '/')}/pdf.worker.min.mjs`;
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
} else {
  // Client-side: use HTTP URL from public directory
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Extracts plain text from a PDF buffer using pdfjs-dist.
 */
export async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ 
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
  }).promise;
  
  const textParts: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Extract text items
    const pageText = content.items
      .map((item) => {
        if ("str" in item) return item.str;
        return "";
      })
      .join(" ");
    
    textParts.push(pageText);
  }
  
  return textParts.join("\n\n").trim();
}
