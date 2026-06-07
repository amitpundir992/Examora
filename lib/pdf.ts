import PDFParser from "pdf2json";

/**
 * Extracts plain text from a PDF buffer.
 */
export async function extractPdfText(data: Uint8Array): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (errData: Error | { parserError: Error }) => {
      const error = errData instanceof Error ? errData : errData.parserError;
      reject(error);
    });

    pdfParser.on("pdfParser_dataReady", () => {
      // getRawTextContent is not in types but exists at runtime
      const text = (pdfParser as unknown as { getRawTextContent(): string }).getRawTextContent();
      resolve(text.trim());
    });

    pdfParser.parseBuffer(Buffer.from(data));
  });
}
