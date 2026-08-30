import React, { useState, useEffect } from "react";
import apiClient from "../../services/api.ts";
import { CollegeDocument, DocumentCategory, ApiResponse, DocumentChunk } from "../../types/index.ts";
import {
  BookOpen,
  Search,
  FileText,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  ChevronRight,
  X,
  FileSearch,
} from "lucide-react";

interface KnowledgeBaseViewProps {
  onAskAboutDocument: (prompt: string) => void;
}

const categories: Array<{ id: string; label: string }> = [
  { id: "All", label: "All Documents" },
  { id: "Admissions", label: "Admissions" },
  { id: "Academics", label: "Academics" },
  { id: "Examinations", label: "Examinations" },
  { id: "Hostel", label: "Hostel & Residence" },
  { id: "Library", label: "Library" },
  { id: "Scholarships", label: "Scholarships" },
  { id: "Placements", label: "Placements" },
  { id: "Policies", label: "Policies & Code" },
];

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({ onAskAboutDocument }) => {
  const [documents, setDocuments] = useState<CollegeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Inspect document chunks modal
  const [inspectingDoc, setInspectingDoc] = useState<CollegeDocument | null>(null);
  const [inspectChunks, setInspectChunks] = useState<DocumentChunk[]>([]);
  const [loadingChunks, setLoadingChunks] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<ApiResponse<CollegeDocument[]>>("/documents", {
        params: {
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          search: searchQuery.trim() || undefined,
        },
      });

      if (res.data.success && res.data.data) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      console.error("[KnowledgeBase] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleInspectDocument = async (doc: CollegeDocument) => {
    setInspectingDoc(doc);
    setLoadingChunks(true);
    try {
      const res = await apiClient.get<ApiResponse<{ document: CollegeDocument; chunks: DocumentChunk[] }>>(
        `/documents/${doc.id}`
      );
      if (res.data.success && res.data.data) {
        setInspectChunks(res.data.data.chunks);
      }
    } catch (err) {
      console.error("[KnowledgeBase] Error inspecting chunks:", err);
    } finally {
      setLoadingChunks(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            Official Verified Knowledge Repository
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">College Knowledge Base</h1>
          <p className="text-xs text-slate-600 mt-1 max-w-xl">
            All documents here are indexed and cross-referenced in real-time by the CampusIQ RAG engine to provide accurate answers.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search circulars, regulations, notices..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-blue-500 text-slate-900"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-md text-xs font-semibold uppercase tracking-wider transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-44 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No documents found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or switching categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-red-500 text-[10px] font-bold px-1.5 py-0.5 bg-red-50 rounded border border-red-200">
                      PDF
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {doc.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Indexed ({doc.chunkCount})
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                    {doc.name}
                  </h3>
                  {doc.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {doc.description}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Pages</span>
                    <span className="font-semibold text-slate-700">{doc.pageCount || 1} Pages</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Size</span>
                    <span className="font-semibold text-slate-700">{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleInspectDocument(doc)}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors flex items-center gap-1"
                >
                  <FileSearch className="w-3.5 h-3.5 text-slate-500" />
                  View Chunks
                </button>

                <button
                  onClick={() => onAskAboutDocument(`Explain the rules and regulations in ${doc.name}`)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1 shadow-xs"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Ask AI
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inspect Document Chunks Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden text-slate-900">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-[10px] font-bold px-1.5 py-0.5 bg-red-50 rounded border border-red-200">
                    PDF
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 uppercase">
                    {inspectingDoc.category}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                    {inspectingDoc.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Extracted RAG Vectors ({inspectChunks.length} Semantic Chunks)
                </p>
              </div>
              <button
                onClick={() => setInspectingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content / Chunks list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingChunks ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : inspectChunks.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-8">
                  No indexed chunks found for this document.
                </p>
              ) : (
                inspectChunks.map((chunk, cIdx) => (
                  <div
                    key={chunk.id || cIdx}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-slate-600 font-semibold text-[11px]">
                      <span className="text-blue-600">
                        Chunk #{chunk.chunkIndex} {chunk.pageNumber ? `(Page ${chunk.pageNumber})` : ""}
                      </span>
                      {chunk.metadata?.sectionHeading && (
                        <span className="text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {chunk.metadata.sectionHeading}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 leading-relaxed font-mono text-[11px] bg-white p-2.5 rounded border border-slate-100 whitespace-pre-wrap">
                      {chunk.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Embeddings generated with semantic vector hashing
              </span>
              <button
                onClick={() => {
                  const doc = inspectingDoc;
                  setInspectingDoc(null);
                  onAskAboutDocument(`What are the key points in ${doc.name}?`);
                }}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Ask Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
