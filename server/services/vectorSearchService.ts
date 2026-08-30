import { db } from "./db.ts";
import { generateEmbedding, cosineSimilarity, generateDenseKeywordEmbedding } from "./embeddingService.ts";
import { DocumentChunk, SourceReference } from "../models/types.ts";
import { config } from "../config/config.ts";

export interface ScoredChunk {
  chunk: DocumentChunk;
  score: number;
}

export async function searchRelevantChunks(
  query: string,
  options?: {
    topK?: number;
    threshold?: number;
    category?: string;
  }
): Promise<ScoredChunk[]> {
  const topK = options?.topK || config.rag.topK;
  const threshold = options?.threshold || config.rag.similarityThreshold;
  const targetCategory = options?.category;

  // Retrieve all chunks from documents that are in "ready" state
  let allChunks = await db.getAllReadyChunks();

  if (targetCategory && targetCategory !== "All") {
    allChunks = allChunks.filter((c) => c.category.toLowerCase() === targetCategory.toLowerCase());
  }

  if (allChunks.length === 0) {
    return [];
  }

  // Generate vector for the query
  const queryVector = await generateEmbedding(query);
  const queryKeywordVector = generateDenseKeywordEmbedding(query, 384);

  // Normalize query words for lexical scoring bonus
  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const scored: ScoredChunk[] = [];

  for (const chunk of allChunks) {
    // If chunk embedding is missing or empty, generate or compute fallback
    let chunkVec = chunk.embedding;
    if (!chunkVec || chunkVec.length === 0) {
      chunkVec = generateDenseKeywordEmbedding(chunk.text, 384);
    }

    let semanticScore = 0;
    if (chunkVec.length === queryVector.length) {
      semanticScore = cosineSimilarity(queryVector, chunkVec);
    } else {
      const chunkKeywordVec = generateDenseKeywordEmbedding(chunk.text, 384);
      semanticScore = cosineSimilarity(queryKeywordVector, chunkKeywordVec);
    }

    // Lexical exact matching bonus (e.g., terms like "hostel", "examination", "library", "scholarship", "attendance", "curfew", "8:00 AM")
    const chunkTextLower = chunk.text.toLowerCase();
    let termMatches = 0;
    for (const word of queryWords) {
      if (chunkTextLower.includes(word)) {
        termMatches++;
      }
    }
    const lexicalBonus = queryWords.length > 0 ? (termMatches / queryWords.length) * 0.35 : 0;
    const finalScore = Math.min(1, semanticScore * 0.65 + lexicalBonus);

    if (finalScore >= threshold) {
      scored.push({
        chunk,
        score: finalScore,
      });
    }
  }

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK);
}

export function formatSourcesFromChunks(scoredChunks: ScoredChunk[]): SourceReference[] {
  return scoredChunks.map((item) => ({
    documentId: item.chunk.documentId,
    documentName: item.chunk.documentName,
    category: item.chunk.category,
    pageNumber: item.chunk.pageNumber,
    chunkIndex: item.chunk.chunkIndex,
    snippet: item.chunk.text.length > 220 ? item.chunk.text.substring(0, 220) + "..." : item.chunk.text,
    similarity: Math.round(item.score * 100) / 100,
  }));
}
