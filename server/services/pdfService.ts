import fs from "fs";
import path from "path";

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export interface ExtractionResult {
  fullText: string;
  pages: ExtractedPage[];
  pageCount: number;
}

export async function extractTextFromFile(filePath: string, mimeType: string): Promise<ExtractionResult> {
  const absolutePath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const fileBuffer = fs.readFileSync(absolutePath);

  // If PDF
  if (mimeType.includes("pdf") || filePath.endsWith(".pdf")) {
    try {
      // Dynamic import of pdf-parse lib
      let pdfParse: any;
      try {
        // @ts-ignore
        const lib = await import("pdf-parse/lib/pdf-parse.js");
        pdfParse = lib.default || lib;
      } catch {
        // @ts-ignore
        const mainModule = await import("pdf-parse");
        pdfParse = mainModule.default || mainModule;
      }
      
      if (typeof pdfParse !== "function" && pdfParse?.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: fileBuffer });
        const res = await parser.getText();
        const rawText = res?.text || "";
        const cleaned = cleanText(rawText);
        return {
          fullText: cleaned,
          pages: [{ pageNumber: 1, text: cleaned }],
          pageCount: res?.numpages || 1,
        };
      }
      
      const data = await pdfParse(fileBuffer);
      const rawText = data.text || "";
      const cleaned = cleanText(rawText);

      // Estimate or split pages based on form feeds (\f) or page count
      const rawPages = rawText.split(/\f|\n\s*---\s*Page\s*\d+\s*---\s*\n/i);
      const pages: ExtractedPage[] = [];

      if (rawPages.length > 1) {
        rawPages.forEach((pText: string, idx: number) => {
          const cleanedPage = cleanText(pText);
          if (cleanedPage.length > 0) {
            pages.push({
              pageNumber: idx + 1,
              text: cleanedPage,
            });
          }
        });
      } else {
        // Synthetically segment by ~1800 characters per page if no form feed
        const chunkSize = 1800;
        let pNum = 1;
        for (let i = 0; i < cleaned.length; i += chunkSize) {
          pages.push({
            pageNumber: pNum++,
            text: cleaned.substring(i, i + chunkSize),
          });
        }
      }

      return {
        fullText: cleaned,
        pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: cleaned }],
        pageCount: data.numpages || pages.length || 1,
      };
    } catch (pdfErr) {
      console.warn(`[PDFService] pdf-parse warning, attempting text extraction fallback:`, pdfErr);
      // Fallback text extraction from string buffer
      const text = fileBuffer.toString("utf-8");
      const cleaned = cleanText(text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, " "));
      return {
        fullText: cleaned,
        pages: [{ pageNumber: 1, text: cleaned }],
        pageCount: 1,
      };
    }
  }

  // Plain text, markdown, csv, or json files
  const rawText = fileBuffer.toString("utf-8");
  const cleaned = cleanText(rawText);
  return {
    fullText: cleaned,
    pages: [{ pageNumber: 1, text: cleaned }],
    pageCount: 1,
  };
}

export function cleanText(text: string): string {
  if (!text) return "";
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}
