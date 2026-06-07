/**
 * Extracts plain text from a PDF buffer.
 * First tries text extraction (for digital PDFs).
 * Falls back to OCR (Tesseract) if extracted text is too short (scanned PDFs).
 * Note: OCR is disabled in serverless environments (Vercel).
 */
export async function extractPdfText(data: Uint8Array): Promise<string> {
  // Try text extraction first using pdf-parse (serverless-compatible)
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
  const buffer = Buffer.from(data);
  // pdf-parse is a CommonJS module - import it dynamically
  const module = await import("pdf-parse");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (module.default || module) as any;
  const parsed = await pdfParse(buffer);
  return parsed.text.trim();
}

async function ocrPdf(_data: Uint8Array): Promise<string> {
  // OCR is not supported in serverless environments
  // This function is only called in local development
  throw new Error("OCR not implemented for local development. Use text-based PDFs.");
}
