import { config } from "../config/config.ts";
import { ExtractedPage } from "./pdfService.ts";

export interface RawChunk {
  text: string;
  pageNumber: number;
  chunkIndex: number;
  heading?: string;
}

export function chunkExtractedPages(
  pages: ExtractedPage[],
  chunkSize = config.rag.chunkSize,
  chunkOverlap = config.rag.chunkOverlap
): RawChunk[] {
  const chunks: RawChunk[] = [];
  let globalChunkIndex = 1;

  for (const page of pages) {
    const pageText = page.text.trim();
    if (!pageText) continue;

    // Detect headings (e.g. "Section 1", "Chapter 2", "Article 3", or capitalized lines)
    const paragraphs = pageText.split(/\n\s*\n/);
    let currentChunkText = "";
    let currentHeading = "";

    for (const paragraph of paragraphs) {
      const trimmedPara = paragraph.trim();
      if (!trimmedPara) continue;

      // Check if paragraph looks like a heading
      const isHeading =
        trimmedPara.length < 80 &&
        (/^(Section|Chapter|Article|Rule|Policy|Part|Clause|\d+\.)/i.test(trimmedPara) ||
          trimmedPara === trimmedPara.toUpperCase());

      if (isHeading) {
        currentHeading = trimmedPara;
      }

      if ((currentChunkText + "\n\n" + trimmedPara).length <= chunkSize) {
        currentChunkText = currentChunkText ? `${currentChunkText}\n\n${trimmedPara}` : trimmedPara;
      } else {
        // If current chunk has content, push it
        if (currentChunkText.trim()) {
          chunks.push({
            text: currentChunkText.trim(),
            pageNumber: page.pageNumber,
            chunkIndex: globalChunkIndex++,
            heading: currentHeading || undefined,
          });
        }

        // If a single paragraph is longer than chunkSize, split it by sentences or fixed words
        if (trimmedPara.length > chunkSize) {
          const sentences = trimmedPara.match(/[^.!?]+[.!?]+(\s|$)/g) || [trimmedPara];
          let subChunk = "";
          for (const sentence of sentences) {
            if ((subChunk + " " + sentence).length <= chunkSize) {
              subChunk = subChunk ? `${subChunk} ${sentence.trim()}` : sentence.trim();
            } else {
              if (subChunk.trim()) {
                chunks.push({
                  text: subChunk.trim(),
                  pageNumber: page.pageNumber,
                  chunkIndex: globalChunkIndex++,
                  heading: currentHeading || undefined,
                });
              }
              // Carry over overlap
              const overlapText = subChunk.slice(-chunkOverlap);
              subChunk = overlapText + " " + sentence.trim();
            }
          }
          currentChunkText = subChunk.trim();
        } else {
          // Carry over overlap from previous chunk
          const words = currentChunkText.split(" ");
          const overlapWords = words.slice(-Math.floor(chunkOverlap / 6)).join(" ");
          currentChunkText = overlapWords ? `${overlapWords} ${trimmedPara}` : trimmedPara;
        }
      }
    }

    if (currentChunkText.trim()) {
      chunks.push({
        text: currentChunkText.trim(),
        pageNumber: page.pageNumber,
        chunkIndex: globalChunkIndex++,
        heading: currentHeading || undefined,
      });
    }
  }

  return chunks;
}
