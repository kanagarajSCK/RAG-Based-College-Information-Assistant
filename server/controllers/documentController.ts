import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { AuthenticatedRequest } from "../middleware/authMiddleware.ts";
import { db } from "../services/db.ts";
import { extractTextFromFile } from "../services/pdfService.ts";
import { chunkExtractedPages } from "../services/chunkingService.ts";
import { generateEmbedding } from "../services/embeddingService.ts";
import { CollegeDocument, DocumentCategory, DocumentChunk } from "../models/types.ts";

export async function uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        message: "No document file uploaded. Please upload a PDF or text document.",
      });
      return;
    }

    const { name, category = "General", description } = req.body;
    const docName = name && name.trim() ? name.trim() : file.originalname.replace(/\.[^/.]+$/, "");
    const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newDoc: CollegeDocument = {
      id: docId,
      name: docName,
      originalName: file.originalname,
      category: (category as DocumentCategory) || "General",
      fileType: file.mimetype || "application/pdf",
      fileSize: file.size,
      storagePath: file.path,
      uploadedBy: req.user?.id || "admin",
      uploadedByName: req.user?.name || "Administrator",
      processingStatus: "processing",
      chunkCount: 0,
      description: description || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Save initial document in DB
    await db.createDocument(newDoc);

    // Process asynchronously so we can handle and log
    processDocumentPipeline(newDoc, file.path, file.mimetype).catch((err) => {
      console.error(`[DocProcessing] Background error for ${docId}:`, err);
    });

    res.status(202).json({
      success: true,
      message: "Document uploaded successfully and queued for RAG indexing.",
      data: newDoc,
    });
  } catch (err: any) {
    console.error("[Doc] Upload error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to upload document.",
    });
  }
}

// Background processing pipeline
async function processDocumentPipeline(doc: CollegeDocument, filePath: string, mimeType: string) {
  try {
    console.log(`[RAG-Pipeline] Starting extraction for "${doc.name}" (${filePath})`);

    // 1. Text Extraction
    const extraction = await extractTextFromFile(filePath, mimeType);
    if (!extraction.fullText || extraction.fullText.trim().length === 0) {
      throw new Error("No readable text found in document. Please check the PDF contents.");
    }

    // 2. Chunking
    const rawChunks = chunkExtractedPages(extraction.pages);
    console.log(`[RAG-Pipeline] Generated ${rawChunks.length} chunks for "${doc.name}"`);

    // 3. Generate embeddings and construct DocumentChunk records
    const documentChunks: DocumentChunk[] = [];
    for (const rc of rawChunks) {
      const chunkId = `chk_${doc.id}_${String(rc.chunkIndex).padStart(3, "0")}`;
      const embedding = await generateEmbedding(rc.text);

      documentChunks.push({
        id: chunkId,
        documentId: doc.id,
        documentName: doc.name,
        category: doc.category,
        text: rc.text,
        embedding,
        pageNumber: rc.pageNumber,
        chunkIndex: rc.chunkIndex,
        metadata: {
          sectionHeading: rc.heading,
          wordCount: rc.text.split(/\s+/).length,
        },
        createdAt: new Date().toISOString(),
      });
    }

    // 4. Save chunks and mark ready
    await db.deleteChunksByDocumentId(doc.id);
    await db.addChunks(documentChunks);

    await db.updateDocument(doc.id, {
      processingStatus: "ready",
      chunkCount: documentChunks.length,
      pageCount: extraction.pageCount,
      processingError: undefined,
    });

    console.log(`[RAG-Pipeline] Document "${doc.name}" successfully indexed with ${documentChunks.length} chunks.`);
  } catch (err: any) {
    console.error(`[RAG-Pipeline] Processing failed for ${doc.id}:`, err);
    await db.updateDocument(doc.id, {
      processingStatus: "failed",
      processingError: err?.message || "Unknown error during text extraction and chunk indexing.",
    });
  }
}

export async function getDocuments(req: Request, res: Response): Promise<void> {
  try {
    const { search, category, status } = req.query;
    const documents = await db.getDocuments({
      search: search as string,
      category: category as string,
      status: status as string,
    });

    res.json({
      success: true,
      data: documents,
    });
  } catch (err: any) {
    console.error("[Doc] getDocuments error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch college documents.",
    });
  }
}

export async function getDocumentById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await db.getDocumentById(id);

    if (!doc) {
      res.status(404).json({
        success: false,
        message: "Document not found.",
      });
      return;
    }

    const chunks = await db.getChunksByDocumentId(id);

    res.json({
      success: true,
      data: {
        document: doc,
        chunks,
      },
    });
  } catch (err: any) {
    console.error("[Doc] getDocumentById error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch document details.",
    });
  }
}

export async function updateDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { name, category, description, reprocess } = req.body;

    const doc = await db.getDocumentById(id);
    if (!doc) {
      res.status(404).json({
        success: false,
        message: "Document not found.",
      });
      return;
    }

    const updates: Partial<CollegeDocument> = {};
    if (name && name.trim()) updates.name = name.trim();
    if (category) updates.category = category;
    if (description !== undefined) updates.description = description;

    if (reprocess) {
      updates.processingStatus = "processing";
      updates.processingError = undefined;
    }

    const updated = await db.updateDocument(id, updates);

    if (reprocess && doc.storagePath && fs.existsSync(doc.storagePath)) {
      processDocumentPipeline(updated || doc, doc.storagePath, doc.fileType).catch(console.error);
    }

    res.json({
      success: true,
      message: "Document updated successfully.",
      data: updated,
    });
  } catch (err: any) {
    console.error("[Doc] updateDocument error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update document.",
    });
  }
}

export async function deleteDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const doc = await db.getDocumentById(id);

    if (!doc) {
      res.status(404).json({
        success: false,
        message: "Document not found.",
      });
      return;
    }

    // Try deleting physical file if exists in uploads
    if (doc.storagePath && fs.existsSync(doc.storagePath)) {
      try {
        fs.unlinkSync(doc.storagePath);
      } catch (fErr) {
        console.warn("[Doc] Could not unlink local file:", fErr);
      }
    }

    await db.deleteDocument(id);

    res.json({
      success: true,
      message: "Document and its indexed chunks were permanently removed from the knowledge base.",
    });
  } catch (err: any) {
    console.error("[Doc] deleteDocument error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to delete document.",
    });
  }
}
