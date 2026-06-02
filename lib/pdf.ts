import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import { createWorker } from "tesseract.js";
import { Canvas } from "canvas";

/**
 * Extracts plain text from a PDF buffer.
 * First tries text extraction (for digital PDFs).
 * Falls back to OCR (Tesseract) if extracted text is too short (scanned PDFs).
 */
export async function extractPdfText(data: Uint8Array): Promise<string> {
  // Try text extraction first
  const textContent = await extractTextFromPdf(data);
  
  // If we got enough text, return it
  if (textContent.length > 100) {
    return textContent;
  }
  
  // Otherwise, try OCR
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
        canvasContext: context,
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
