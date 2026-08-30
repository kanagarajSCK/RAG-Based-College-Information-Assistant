export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  jwtSecret: process.env.JWT_SECRET || "campusiq_production_jwt_secret_key_2026",
  jwtExpiresIn: "7d",
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  aiModel: process.env.AI_MODEL || "gemini-2.5-flash",
  embeddingModel: process.env.EMBEDDING_MODEL || "text-embedding-004",
  rag: {
    chunkSize: 750, // Characters per chunk
    chunkOverlap: 120, // Overlap for boundary context
    topK: 5, // Number of top chunks to retrieve
    similarityThreshold: 0.28, // Cosine similarity threshold for relevance
    maxContextLength: 6000,
  },
  uploadsDir: "./uploads",
  dataDir: "./data",
};
