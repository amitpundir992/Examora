import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";

// Configure worker - use relative path from node_modules
pdfjsLib.GlobalWorkerOptions.workerSrc = 
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs';

/**
 * Extracts plain text from a PDF buffer.
 * First tries text extraction (for digital PDFs).
 * Falls back to OCR (Tesseract) if extracted text is too short (scanned PDFs).
 * Note: OCR is disabled in serverless environments (Vercel).
 */
export async function extractPdfText(data: Uint8Array): Promise<string> {
  // Try text extraction first
  const textContent = await extractTextFromPdf(data);
  
  // If we got enough text, return it
  if (textContent.length > 100) {
    return textContent;
  }
  
  // OCR not available in serverless - return what we have
  if (process.env.VERCEL || !process.env.NODE_ENV || process.env.NODE_ENV === 'production') {
    console.warn("OCR not available in serverless environment. Text extraction found limited content.");
    return textContent;
  }
  
  // Otherwise, try OCR (local development only)
  console.log("Low text content detected, attempting OCR...");
  return await ocrPdf(data);
}

async function extractTextFromPdf(data: Uint8Array): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const textParts: string[] = [];
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    
    // Group text items by vertical position to preserve lines
    const lines: { [y: number]: string[] } = {};
    
    for (const item of content.items as Array<{ str?: string; transform: number[] }>) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!lines[y]) lines[y] = [];
      lines[y].push(item.str);
    }
    
    // Sort by Y position (top to bottom) and join
    const pageText = Object.keys(lines)
      .map(Number)
      .sort((a, b) => b - a) // Reverse Y (top to bottom)
      .map(y => lines[y].join(" ").trim())
      .filter(Boolean)
      .join("\n");
    
    textParts.push(pageText);
  }
  
  return textParts.join("\n\n").trim();
}

async function ocrPdf(data: Uint8Array): Promise<string> {
  // Canvas is optional - only works in environments where node-canvas is available
  let Canvas: { new(width: number, height: number): { getContext(type: string): unknown; toBuffer(): Buffer } };
  try {
    // Use Function constructor to avoid TypeScript checking the module at build time
    const canvasModule = await (new Function('return import("canvas")')() as Promise<{ Canvas: typeof Canvas }>);
    Canvas = canvasModule.Canvas;
  } catch {
    throw new Error("Canvas module not available for OCR. Please ensure node-canvas is installed.");
  }
  
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const worker = await createWorker("eng");
  const textParts: string[] = [];
  
  try {
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      // Render page to canvas
      const canvas = new Canvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");
      
      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;
      
      // OCR the canvas
      const { data: { text } } = await worker.recognize(canvas.toBuffer());
      textParts.push(text);
    }
    
    return textParts.join("\n").trim();
  } finally {
    await worker.terminate();
  }
}
