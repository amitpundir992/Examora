import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

// Disable worker for serverless compatibility
pdfjsLib.GlobalWorkerOptions.workerSrc = "";

/**
 * Extracts plain text from a PDF buffer using pdfjs-dist.
 */
export async function extractPdfText(data: Uint8Array): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ 
    data,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
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
