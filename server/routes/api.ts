import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { signup, login, logout, getMe } from "../controllers/authController.ts";
import {
  sendMessage,
  getConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} from "../controllers/chatController.ts";
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
} from "../controllers/documentController.ts";
import { getAdminStats } from "../controllers/adminController.ts";
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.ts";
import { config } from "../config/config.ts";

const router = Router();

// Ensure uploads dir exists
const uploadsDir = path.resolve(process.cwd(), config.uploadsDir);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    const baseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedExts = [".pdf", ".txt", ".md", ".doc", ".docx", ".json"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext) || file.mimetype.includes("pdf") || file.mimetype.includes("text")) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Please upload PDF, TXT, or MD documents."));
    }
  },
});

// Health check
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "CampusIQ RAG Backend API",
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
router.post("/auth/signup", signup);
router.post("/auth/login", login);
router.post("/auth/logout", logout);
router.get("/auth/me", requireAuth, getMe);

// Chat & Conversation Routes
router.post("/chat", requireAuth, sendMessage);
router.get("/conversations", requireAuth, getConversations);
router.get("/conversations/:id", requireAuth, getConversation);
router.patch("/conversations/:id", requireAuth, updateConversation);
router.delete("/conversations/:id", requireAuth, deleteConversation);

// Document & Knowledge Base Routes
router.get("/documents", getDocuments); // Public or authenticated students can view available docs
router.get("/documents/:id", getDocumentById);
router.post("/documents", requireAuth, requireAdmin, upload.single("file"), uploadDocument);
router.patch("/documents/:id", requireAuth, requireAdmin, updateDocument);
router.delete("/documents/:id", requireAuth, requireAdmin, deleteDocument);

// Admin Routes
router.get("/admin/stats", requireAuth, requireAdmin, getAdminStats);

export default router;
