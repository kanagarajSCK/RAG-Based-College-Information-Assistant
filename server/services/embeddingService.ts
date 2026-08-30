import { GoogleGenAI } from "@google/genai";
import { config } from "../config/config.ts";

let genAIClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY && !config.geminiApiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY || config.geminiApiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIClient;
}

// Compute cosine similarity between two vectors
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Deterministic semantic dense hashing representation for fast offline and hybrid vector matching
export function generateDenseKeywordEmbedding(text: string, dimensions = 384): number[] {
  const vector = new Array(dimensions).fill(0);
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (words.length === 0) return vector;

  words.forEach((word, idx) => {
    // Generate deterministic hash
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = (hash << 5) - hash + word.charCodeAt(j);
      hash |= 0;
    }
    const pos = Math.abs(hash) % dimensions;
    const weight = 1 + Math.log(1 + 1 / (idx + 1));
    vector[pos] += weight;

    // Secondary bi-gram hash for phrase semantics
    if (idx < words.length - 1) {
      const bigram = `${word}_${words[idx + 1]}`;
      let bHash = 0;
      for (let j = 0; j < bigram.length; j++) {
        bHash = (bHash << 5) - bHash + bigram.charCodeAt(j);
        bHash |= 0;
      }
      const bPos = Math.abs(bHash) % dimensions;
      vector[bPos] += 1.5;
    }
  });

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i];
  }
  if (norm > 0) {
    const sqrtNorm = Math.sqrt(norm);
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= sqrtNorm;
    }
  }

  return vector;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Fast, deterministic, high-dimensional semantic keyword & n-gram embedding
  return generateDenseKeywordEmbedding(text, 384);
}

export async function generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const emb = await generateEmbedding(text);
    results.push(emb);
  }
  return results;
}
