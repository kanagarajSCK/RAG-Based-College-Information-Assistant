import { GoogleGenAI } from "@google/genai";
import { config } from "../config/config.ts";
import { searchRelevantChunks, formatSourcesFromChunks } from "./vectorSearchService.ts";
import { SourceReference } from "../models/types.ts";

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

export interface RAGAnswerResult {
  answer: string;
  sources: SourceReference[];
  contextUsedCount: number;
}

export async function generateGroundedAnswer(
  question: string,
  chatHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): Promise<RAGAnswerResult> {
  const client = getAIClient();
  const trimmedQ = question.trim().toLowerCase();
  const isGreeting =
    /^(hi|hello|hey|good\s*(morning|afternoon|evening|day)|who\s+are\s+you|what\s+can\s+you\s+do|help|what\s+is\s+campusiq)[\s?!.]*$/i.test(
      trimmedQ
    ) || trimmedQ.length <= 4;

  // Step 1: Semantic vector retrieval
  const relevantChunks = await searchRelevantChunks(question, {
    topK: config.rag.topK,
    threshold: isGreeting ? 0.2 : config.rag.similarityThreshold,
  });

  // Candidate models priority (fast, verified active Gemini models)
  const candidateModels = [
    config.aiModel || "gemini-2.5-flash",
    "gemini-2.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-2.5-pro",
  ];

  // If greeting or general question with no specific policy requested
  if (isGreeting && (!relevantChunks || relevantChunks.length === 0)) {
    if (client) {
      for (const model of candidateModels) {
        try {
          const response = await client.models.generateContent({
            model,
            contents: `The student said: "${question}".
Greet them warmly as CampusIQ, the official College Information Assistant. Briefly state that you provide grounded answers on college circulars, including Academic regulations & attendance, Hostel residence rules, Library guidelines, Examination schedules, Placement policies, Scholarships, Admissions, and TCS Ignite & Smart Hiring guides. Invite them to ask any question.`,
            config: {
              temperature: 0.7,
            },
          });
          const text = response.text || "";
          if (text.trim()) {
            return {
              answer: text.trim(),
              sources: [],
              contextUsedCount: 0,
            };
          }
        } catch {
          continue;
        }
      }
    }

    return {
      answer:
        "Hello! I am **CampusIQ**, your official College Information Assistant. I can help answer questions regarding academic regulations, attendance criteria, hostel timings, library policies, examination circulars, scholarships, campus placements, and exam hiring guides. How may I assist you today?",
      sources: [],
      contextUsedCount: 0,
    };
  }

  // If no relevant documents were retrieved from the college knowledge base
  if (!relevantChunks || relevantChunks.length === 0) {
    return {
      answer:
        "I couldn't find reliable information about this in the college knowledge base. Please check with the relevant college department, student affairs office, or college administrator, or rephrase your question with specific terms (e.g., *attendance*, *hostel curfew*, *scholarship*, *exam rules*).",
      sources: [],
      contextUsedCount: 0,
    };
  }

  // Format context text from retrieved chunks
  const contextSections = relevantChunks.map((item, idx) => {
    const docName = item.chunk.documentName;
    const page = item.chunk.pageNumber ? ` (Page ${item.chunk.pageNumber})` : "";
    const heading = item.chunk.metadata?.sectionHeading ? ` [${item.chunk.metadata.sectionHeading}]` : "";
    return `--- Source [${idx + 1}]: "${docName}"${page}${heading} ---\n${item.chunk.text}`;
  });

  const assembledContext = contextSections.join("\n\n");
  const sources = formatSourcesFromChunks(relevantChunks);

  const systemInstruction = `You are CampusIQ, the official College Information Assistant.
Your job is to provide accurate, helpful, and concise answers to student and faculty questions based SOLELY on the retrieved official college documents provided in the context below.

STRICT GROUNDING DIRECTIVES:
1. Answer using ONLY the facts, policies, rules, dates, numbers, fees, and requirements mentioned in the provided Context.
2. DO NOT invent, assume, extrapolate, or hallucinate college policies, dates, numbers, course names, or regulations.
3. If the retrieved context does not contain enough information or is silent on the question, state clearly: "I couldn't find reliable information about this in the college knowledge base. Please check with the relevant college department or administrator."
4. Maintain a professional, polite, and academic tone. Format key points with bullet points or bold text where appropriate for high readability.
5. Explicitly mention the document names or pages in your explanation where relevant.`;

  const conversationContext = chatHistory
    .slice(-4)
    .map((m) => `${m.role === "user" ? "Student" : "CampusIQ"}: ${m.content}`)
    .join("\n");

  const promptContent = `RETRIEVED COLLEGE KNOWLEDGE BASE CONTEXT:
${assembledContext}

${conversationContext ? `RECENT CONVERSATION HISTORY:\n${conversationContext}\n` : ""}
STUDENT QUESTION:
${question}

Provide your grounded response:`;

  if (client) {
    for (const model of candidateModels) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const response = await client.models.generateContent({
            model,
            contents: promptContent,
            config: {
              systemInstruction,
              temperature: 0.2, // Low temperature for high factual precision
            },
          });

          const text = response.text || "";
          if (text.trim()) {
            return {
              answer: text.trim(),
              sources,
              contextUsedCount: relevantChunks.length,
            };
          }
        } catch (err: any) {
          const errString = String(err?.message || err);
          const isUnavailable =
            errString.includes("503") ||
            errString.includes("UNAVAILABLE") ||
            errString.includes("high demand") ||
            errString.includes("ResourceExhausted") ||
            errString.includes("429");

          if (isUnavailable && attempts < maxAttempts) {
            await new Promise((res) => setTimeout(res, 400 * attempts));
            continue;
          }

          if (isUnavailable) {
            console.warn(`[RAG] Model ${model} is experiencing high demand, falling back...`);
            break;
          } else {
            console.warn(`[RAG] Generation with ${model} failed, trying next fallback model:`, errString.slice(0, 120));
            break;
          }
        }
      }
    }
  }

  // Fallback grounded synthesizer using the retrieved chunks directly if all API calls fail
  const synthesizedFallback = `Based on official college documents:\n\n${relevantChunks
    .map((c) => `• **${c.chunk.documentName}** (Page ${c.chunk.pageNumber || 1}): ${c.chunk.text}`)
    .join("\n\n")}`;

  return {
    answer: synthesizedFallback,
    sources,
    contextUsedCount: relevantChunks.length,
  };
}
