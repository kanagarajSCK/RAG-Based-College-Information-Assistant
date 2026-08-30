export type UserRole = "student" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface SourceReference {
  documentId: string;
  documentName: string;
  category?: string;
  pageNumber?: number;
  chunkIndex?: number;
  snippet: string;
  similarity?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources?: SourceReference[];
  createdAt: string;
}

export type ProcessingStatus = "uploaded" | "processing" | "ready" | "failed";

export type DocumentCategory =
  | "Admissions"
  | "Academics"
  | "Examinations"
  | "Hostel"
  | "Library"
  | "Scholarships"
  | "Placements"
  | "Policies"
  | "General";

export interface CollegeDocument {
  id: string;
  name: string;
  originalName: string;
  category: DocumentCategory;
  fileType: string;
  fileSize: number;
  storagePath: string;
  uploadedBy: string;
  uploadedByName?: string;
  processingStatus: ProcessingStatus;
  processingError?: string;
  chunkCount: number;
  pageCount?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  documentName: string;
  category: DocumentCategory;
  text: string;
  pageNumber?: number;
  chunkIndex: number;
  metadata?: {
    sectionHeading?: string;
    wordCount?: number;
  };
  createdAt: string;
}

export interface AdminStats {
  totalDocuments: number;
  readyDocuments: number;
  processingDocuments: number;
  failedDocuments: number;
  totalIndexedChunks: number;
  totalConversations: number;
  totalQuestionsAnswered: number;
  recentUploads: CollegeDocument[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}
