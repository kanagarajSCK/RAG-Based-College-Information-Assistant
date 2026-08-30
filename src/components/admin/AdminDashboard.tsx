import React, { useState, useEffect, useRef } from "react";
import apiClient from "../../services/api.ts";
import {
  CollegeDocument,
  DocumentCategory,
  AdminStats,
  ApiResponse,
  DocumentChunk,
} from "../../types/index.ts";
import { useToast } from "../../context/ToastContext.tsx";
import { ConfirmationModal } from "../common/ConfirmationModal.tsx";
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  Search,
  Trash2,
  RotateCw,
  Eye,
  Plus,
  HelpCircle,
  ShieldCheck,
  Building,
  Calendar,
  Award,
  X,
  FileCheck,
  TrendingUp,
} from "lucide-react";

const categories: DocumentCategory[] = [
  "Admissions",
  "Academics",
  "Examinations",
  "Hostel",
  "Library",
  "Scholarships",
  "Placements",
  "Policies",
  "General",
];

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [documents, setDocuments] = useState<CollegeDocument[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload Form State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState<DocumentCategory>("General");
  const [docDescription, setDocDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Inspect Chunks Modal
  const [inspectDoc, setInspectDoc] = useState<CollegeDocument | null>(null);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  // Delete Confirmation Modal
  const [docToDelete, setDocToDelete] = useState<CollegeDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsRes, docsRes] = await Promise.all([
        apiClient.get<ApiResponse<AdminStats>>("/admin/stats"),
        apiClient.get<ApiResponse<CollegeDocument[]>>("/documents"),
      ]);

      if (statsRes.data.success && statsRes.data.data) {
        setStats(statsRes.data.data);
      }
      if (docsRes.data.success && docsRes.data.data) {
        setDocuments(docsRes.data.data);
      }
    } catch (err) {
      console.error("[Admin] Error fetching admin analytics:", err);
      showToast("Failed to load administration data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
    // Periodic poll while items are processing
    const interval = setInterval(() => {
      apiClient.get<ApiResponse<CollegeDocument[]>>("/documents").then((res) => {
        if (res.data.success && res.data.data) {
          setDocuments(res.data.data);
        }
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (file: File) => {
    setUploadFile(file);
    if (!docName) {
      setDocName(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("Please select a PDF or document file to upload.", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("name", docName.trim());
    formData.append("category", docCategory);
    if (docDescription.trim()) {
      formData.append("description", docDescription.trim());
    }

    try {
      const res = await apiClient.post<ApiResponse<CollegeDocument>>("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        showToast("Document uploaded! RAG chunking and vector indexing in progress.", "success");
        setUploadFile(null);
        setDocName("");
        setDocDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        fetchAdminData();
      }
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to upload document.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInspectChunks = async (doc: CollegeDocument) => {
    setInspectDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await apiClient.get<ApiResponse<{ document: CollegeDocument; chunks: DocumentChunk[] }>>(
        `/documents/${doc.id}`
      );
      if (res.data.success && res.data.data) {
        setChunks(res.data.data.chunks);
      }
    } catch (err) {
      showToast("Failed to load chunks.", "error");
    } finally {
      setLoadingChunks(false);
    }
  };

  const handleReprocess = async (docId: string) => {
    try {
      await apiClient.patch(`/documents/${docId}`, { reprocess: true });
      showToast("Document re-indexing triggered.", "info");
      fetchAdminData();
    } catch (err) {
      showToast("Failed to reprocess document.", "error");
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/documents/${docToDelete.id}`);
      showToast("Document and its vectors removed from knowledge base.", "success");
      setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
      fetchAdminData();
    } catch (err) {
      showToast("Failed to delete document.", "error");
    } finally {
      setIsDeleting(false);
      setDocToDelete(null);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || doc.processingStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!docToDelete}
        title="Delete Document"
        message={`Are you sure you want to remove "${docToDelete?.name}"? All associated indexed vectors will be permanently purged from the college assistant's retrieval memory.`}
        confirmLabel="Delete Document"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={handleDeleteDocument}
        onCancel={() => setDocToDelete(null)}
      />

      {/* Admin Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-900 border border-amber-200 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
            Administrative RAG Console
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">College Knowledge Operations</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Upload institutional circulars, monitor semantic chunking pipelines, and audit AI retrieval accuracy.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-2xs self-start md:self-auto"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </button>
      </div>

      {/* Key Metric Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Documents</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalDocuments || documents.length}</p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-green-700 font-semibold">
            <span>{stats?.readyDocuments || documents.filter((d) => d.processingStatus === "ready").length} indexed & ready</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Indexed Chunks</span>
            <Layers className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalIndexedChunks || 0}</p>
          <div className="mt-1 text-[11px] text-slate-500">
            <span>Semantic vector embeddings</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Inquiries</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalConversations || 0}</p>
          <div className="mt-1 text-[11px] text-slate-500">
            <span>Student chat threads</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Grounded Answers</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{stats?.totalQuestionsAnswered || 0}</p>
          <div className="mt-1 text-[11px] text-slate-500">
            <span>Strict zero-hallucination answers</span>
          </div>
        </div>
      </div>

      {/* Document Ingestion / Upload Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-blue-600" />
          Upload & Index Official College Document
        </h2>
        <p className="text-xs text-slate-500 mb-6">
          Uploaded files will be extracted, cleaned, partitioned into semantic chunks with overlap, and embedded into the vector store.
        </p>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          {/* Drag and Drop Box */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-blue-600 bg-blue-50/50"
                : uploadFile
                ? "border-emerald-400 bg-emerald-50/20"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.txt,.md,.doc,.docx"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            {uploadFile ? (
              <div className="flex items-center justify-center gap-3">
                <FileCheck className="w-8 h-8 text-emerald-600" />
                <div className="text-left">
                  <p className="text-sm font-bold text-slate-800">{uploadFile.name}</p>
                  <p className="text-xs text-slate-500">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for ingestion</p>
                </div>
              </div>
            ) : (
              <div>
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-800">
                  Click to browse or drag and drop college circulars / PDF documents
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supported formats: PDF, Markdown, Plain Text (Max 30 MB)
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Document Title
              </label>
              <input
                type="text"
                required
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="e.g. 2026 Hostel Guidelines and Allotment Rules"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-900 bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Description / Remarks (Optional)
            </label>
            <input
              type="text"
              value={docDescription}
              onChange={(e) => setDocDescription(e.target.value)}
              placeholder="e.g. Covers curfew hours, room allotment, mess timings, and penalties."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-900"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isUploading || !uploadFile}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-sm"
            >
              {isUploading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing & Indexing...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload & Ingest to Knowledge Base</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Document Management Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white">
          <div>
            <h3 className="text-base font-bold text-slate-900">Knowledge Base Documents ({documents.length})</h3>
            <p className="text-xs text-slate-500">Live inventory of indexed files backing the RAG retrieval pipeline.</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter documents..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-slate-800"
              />
            </div>

            {/* Status select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="ready">Ready (Indexed)</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Document Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Chunks</th>
                <th className="py-3 px-4">Uploaded By</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No documents matching criteria.
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => {
                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-red-500 text-[10px] font-bold px-1.5 py-0.5 bg-red-50 rounded border border-red-200 shrink-0">
                            PDF
                          </span>
                          <div>
                            <div className="font-semibold text-slate-900">{doc.name}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-xs">{doc.originalName}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {doc.category}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {doc.processingStatus === "ready" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-800 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Ready
                          </span>
                        )}
                        {doc.processingStatus === "processing" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                            Processing...
                          </span>
                        )}
                        {doc.processingStatus === "failed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200" title={doc.processingError}>
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            Failed
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">{doc.chunkCount}</span>
                        <span className="text-slate-400 text-[10px]"> vectors</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{doc.uploadedByName || "Admin"}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleInspectChunks(doc)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100"
                            title="Inspect Chunks"
                            aria-label="Inspect chunks"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleReprocess(doc.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 rounded-md hover:bg-slate-100"
                            title="Re-index Document"
                            aria-label="Re-index document"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDocToDelete(doc)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50"
                            title="Delete Document"
                            aria-label="Delete document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Document Chunks Modal */}
      {inspectDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-900">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 truncate max-w-lg">
                  Vector Chunks: {inspectDoc.name}
                </h3>
                <p className="text-xs text-slate-500">
                  {chunks.length} Extracted Semantic Segments
                </p>
              </div>
              <button
                onClick={() => setInspectDoc(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingChunks ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-16 bg-slate-100 rounded-md animate-pulse" />
                  ))}
                </div>
              ) : chunks.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">
                  No indexed chunks found for this document.
                </p>
              ) : (
                chunks.map((c, i) => (
                  <div key={c.id || i} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-700 mb-1">
                      <span className="text-blue-900">Chunk #{c.chunkIndex} (Page {c.pageNumber || 1})</span>
                      {c.metadata?.sectionHeading && (
                        <span className="text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 text-[10px]">
                          {c.metadata.sectionHeading}
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-100 leading-relaxed">
                      {c.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setInspectDoc(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
