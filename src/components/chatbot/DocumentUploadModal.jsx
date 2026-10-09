import { useState, useEffect, useRef, useMemo } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Lock,
  X,
  RefreshCw,
  Layers,
  Clock,
  Calendar,
  Sparkles,
  Search,
  ChevronRight,
} from "lucide-react";
import { uploadDocument, getDocuments, deleteDocument } from "../../services/chatService";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return "";
  }
}

function formatFullDateTime(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return `${d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })} at ${d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;
  } catch {
    return "";
  }
}

function getFileTypeConfig(fileName, fileType, isDark = false) {
  const ext = (fileType || fileName?.split(".").pop() || "pdf").toLowerCase();
  switch (ext) {
    case "pdf":
      return {
        badgeClass: isDark ? "bg-rose-950/40 text-rose-300 border-rose-800/60" : "bg-rose-50 text-rose-700 border-rose-200/70",
        iconClass: isDark ? "text-rose-400 bg-rose-950/30 border-rose-900/50" : "text-rose-600 bg-rose-50/80 border-rose-100",
        label: "PDF",
      };
    case "docx":
    case "doc":
      return {
        badgeClass: isDark ? "bg-blue-950/40 text-blue-300 border-blue-800/60" : "bg-blue-50 text-blue-700 border-blue-200/70",
        iconClass: isDark ? "text-blue-400 bg-blue-950/30 border-blue-900/50" : "text-blue-600 bg-blue-50/80 border-blue-100",
        label: "DOCX",
      };
    case "txt":
    case "md":
      return {
        badgeClass: isDark ? "bg-amber-950/40 text-amber-300 border-amber-800/60" : "bg-amber-50 text-amber-700 border-amber-200/70",
        iconClass: isDark ? "text-amber-400 bg-amber-950/30 border-amber-900/50" : "text-amber-600 bg-amber-50/80 border-amber-100",
        label: ext.toUpperCase(),
      };
    default:
      return {
        badgeClass: isDark ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-slate-100 text-slate-700 border-slate-200",
        iconClass: isDark ? "text-slate-300 bg-slate-800 border-slate-700" : "text-slate-600 bg-slate-50 border-slate-200",
        label: ext.toUpperCase() || "DOC",
      };
  }
}

export default function DocumentUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  onViewDocument,
  isDark = false,
}) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [uploadingFileName, setUploadingFileName] = useState("");
  const fileInputRef = useRef(null);

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const data = await getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const start = Date.now();
    try {
      await fetchDocs();
    } finally {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 600 - elapsed);
      setTimeout(() => {
        setIsRefreshing(false);
      }, remaining);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
      setUploadResult(null);
      setUploadError(null);
      setSearchFilter("");
      setUploadingFileName("");
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (onClose) onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Filter documents based on searchFilter
  const filteredDocuments = useMemo(() => {
    if (!searchFilter.trim()) return documents;
    const query = searchFilter.toLowerCase().trim();
    return documents.filter(
      (d) =>
        d.file_name.toLowerCase().includes(query) ||
        (d.file_type && d.file_type.toLowerCase().includes(query)) ||
        (d.status && d.status.toLowerCase().includes(query))
    );
  }, [documents, searchFilter]);

  const totalSections = useMemo(() => {
    return documents.reduce((sum, d) => sum + (d.chunk_count || 0), 0);
  }, [documents]);

  const handleViewDoc = (doc) => {
    if (!doc) return;
    const docInfo = {
      documentId: doc.document_id || doc.documentId,
      documentName: doc.file_name || doc.documentName || "Document",
      isDefault:
        Boolean(doc.is_default || doc.isDefault) ||
        (doc.document_id || doc.documentId) === "00000000-0000-0000-0000-000000000002" ||
        (doc.file_name || doc.documentName) === "WorkPilot_Company_Policy.pdf",
    };

    // Close the upload modal first so the reader is front-and-center
    if (onClose) {
      onClose();
    }

    if (onViewDocument) {
      onViewDocument(docInfo);
    }

    // Always dispatch global event as a failsafe so PolicyHandbookModal opens immediately
    window.dispatchEvent(
      new CustomEvent("open-policy-handbook", {
        detail: {
          page: 1,
          docInfo,
        },
      })
    );
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    const allowed = [".pdf", ".docx", ".txt", ".md"];
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!allowed.includes(ext)) {
      setUploadError(`Unsupported file format. Please upload PDF, Word (DOCX), or Text (TXT/MD).`);
      return;
    }

    setUploadingFileName(file.name);
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);
    setUploadResult(null);

    try {
      const result = await uploadDocument(file, (percent) => {
        setUploadProgress(Math.min(90, percent));
      });
      setUploadProgress(100);
      setUploadResult(result);
      await fetchDocs();
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      let msg = "Upload failed. Please check the file and try again.";
      const detail = err.response?.data?.detail;
      if (typeof detail === "string") {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail
          .map((d) => (typeof d === "object" ? d.msg || d.message || JSON.stringify(d) : String(d)))
          .join(", ");
      } else if (err.response?.data?.message) {
        msg = String(err.response.data.message);
      } else if (err.message) {
        msg = err.message;
      }
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId, fileName) => {
    if (docId === "00000000-0000-0000-0000-000000000002") {
      alert("The default company policy document is protected and cannot be deleted.");
      return;
    }
    if (!window.confirm(`Delete document "${fileName}" and purge its vectors?`)) return;
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.document_id !== docId));
    } catch (err) {
      alert("Failed to delete document: " + (err.response?.data?.detail || err.message));
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "READY":
      case "INDEXED":
        return isDark
          ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60"
          : "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "UPDATED":
        return isDark
          ? "bg-blue-950/40 text-blue-300 border-blue-800/60"
          : "bg-blue-50 text-blue-700 border-blue-200";
      case "PROCESSING":
        return isDark
          ? "bg-amber-950/40 text-amber-300 border-amber-800/60 animate-pulse"
          : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse";
      case "FAILED":
        return isDark
          ? "bg-rose-950/40 text-rose-300 border-rose-800/60"
          : "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return isDark
          ? "bg-slate-800 text-slate-300 border-slate-700"
          : "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ zIndex: 70 }}
      className={`fixed inset-0 flex items-start justify-center pt-16 sm:pt-20 pb-8 px-4 overflow-y-auto backdrop-blur-md animate-in fade-in duration-200 ${
        isDark ? "bg-black/80" : "bg-slate-900/60"
      }`}
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden my-auto transition-all ${
          isDark
            ? "bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl"
            : "bg-white border-slate-200 text-slate-800"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 ${
            isDark ? "bg-zinc-900 text-white border-zinc-800" : "bg-slate-900 text-white border-slate-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDark
                  ? "bg-zinc-800 border border-zinc-700/80 text-indigo-400"
                  : "bg-indigo-600/20 border border-indigo-400/30 text-indigo-400"
              }`}
            >
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">
                Knowledge Base Documents
              </h2>
              <p className={`text-xs ${isDark ? "text-zinc-400" : "text-slate-400"}`}>
                Upload and manage policy documents for AI Assistant retrieval
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark
                ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 sm:p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? isDark
                  ? "border-indigo-500 bg-indigo-950/40 scale-[1.005]"
                  : "border-indigo-500 bg-indigo-50/50 scale-[1.005]"
                : isDark
                ? "border-zinc-800 bg-zinc-950 hover:border-zinc-700 hover:bg-zinc-850/80"
                : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/70"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2.5 shadow-2xs ${
                isDark
                  ? "bg-zinc-800 border border-zinc-700/80 text-indigo-400"
                  : "bg-indigo-50 border border-indigo-100 text-indigo-600"
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              ) : (
                <UploadCloud className="w-5 h-5" />
              )}
            </div>
            <h3 className={`text-sm font-semibold ${isDark ? "text-zinc-100" : "text-slate-800"}`}>
              {isUploading
                ? `Indexing: ${uploadingFileName || "Document"}...`
                : "Click to select or drop document here"}
            </h3>
            <p className={`text-xs mt-1 ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              Supports PDF, Word (DOCX), and Text (TXT, MD) up to 25MB
            </p>

            {/* Progress bar */}
            {isUploading && (
              <div className="mt-4 max-w-xs mx-auto">
                <div
                  className={`w-full rounded-full h-1.5 overflow-hidden ${
                    isDark ? "bg-zinc-800" : "bg-slate-200"
                  }`}
                >
                  <div
                    className="bg-indigo-600 h-1.5 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className={`text-[11px] mt-1.5 font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  {uploadProgress < 90
                    ? `Uploading ${uploadingFileName || "file"} (${uploadProgress}%)`
                    : `Extracting pages & embedding sections into knowledge base...`}
                </p>
              </div>
            )}
          </div>

          {/* Success Banner */}
          {uploadResult && (
            <div
              className={`p-4 rounded-xl text-xs shadow-2xs space-y-3 animate-in fade-in duration-200 border ${
                isDark
                  ? "bg-emerald-950/20 border-emerald-900/40 text-slate-200"
                  : "bg-emerald-50/40 border-emerald-200/80 text-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div
                  className={`flex items-center gap-2 font-semibold text-sm ${
                    isDark ? "text-emerald-300" : "text-emerald-950"
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate max-w-[280px] sm:max-w-md">
                    Document Processed: {uploadResult.file_name}
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide border ${getStatusBadge(
                      "READY"
                    )}`}
                  >
                    READY
                  </span>
                </div>
              </div>

              <p className={`text-xs ${isDark ? "text-zinc-300" : "text-slate-600"}`}>
                Document is indexed and actively available for AI Assistant queries and citations.
              </p>

              {/* Incremental Embedding Breakdown */}
              <div
                className={`rounded-lg p-3 shadow-2xs space-y-2 border ${
                  isDark ? "bg-zinc-950 border-zinc-800" : "bg-white border-emerald-100"
                }`}
              >
                <div
                  className={`text-[10px] font-semibold uppercase tracking-wider flex items-center justify-between ${
                    isDark ? "text-zinc-400" : "text-slate-500"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    <span>Incremental Embedding Breakdown</span>
                  </span>
                  <span className={`text-[11px] font-mono ${isDark ? "text-zinc-300" : "text-slate-600"}`}>
                    Total Chunks: {uploadResult.total_chunks || 0}
                  </span>
                </div>

                {/* Minimal Professional Stat Counters */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div
                    className={`p-2 rounded-md border ${
                      isDark
                        ? "bg-emerald-950/40 border-emerald-800/60"
                        : "bg-emerald-50/50 border-emerald-100/80"
                    }`}
                  >
                    <span
                      className={`block text-[10px] uppercase font-medium ${
                        isDark ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      Added
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isDark ? "text-emerald-200" : "text-emerald-800"
                      }`}
                    >
                      +{uploadResult.chunks_added ?? 0}
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-md border ${
                      isDark
                        ? "bg-blue-950/40 border-blue-800/60"
                        : "bg-blue-50/50 border-blue-100/80"
                    }`}
                  >
                    <span
                      className={`block text-[10px] uppercase font-medium ${
                        isDark ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      Re-embedded
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isDark ? "text-blue-200" : "text-blue-800"
                      }`}
                    >
                      {uploadResult.chunks_updated ?? 0}
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-md border ${
                      isDark
                        ? "bg-amber-950/40 border-amber-800/60"
                        : "bg-amber-50/50 border-amber-100/80"
                    }`}
                  >
                    <span
                      className={`block text-[10px] uppercase font-medium ${
                        isDark ? "text-amber-300" : "text-amber-700"
                      }`}
                    >
                      Skipped (0 Cost)
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isDark ? "text-amber-200" : "text-amber-800"
                      }`}
                    >
                      {uploadResult.chunks_skipped ?? 0}
                    </span>
                  </div>
                  <div
                    className={`p-2 rounded-md border ${
                      isDark
                        ? "bg-rose-950/40 border-rose-800/60"
                        : "bg-rose-50/50 border-rose-100/80"
                    }`}
                  >
                    <span
                      className={`block text-[10px] uppercase font-medium ${
                        isDark ? "text-rose-300" : "text-rose-700"
                      }`}
                    >
                      Deleted
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        isDark ? "text-rose-200" : "text-rose-800"
                      }`}
                    >
                      {uploadResult.chunks_deleted ?? 0}
                    </span>
                  </div>
                </div>

                {uploadResult.chunks_skipped > 0 && !uploadResult.chunks_added && !uploadResult.chunks_updated && (
                  <div
                    className={`text-[11px] px-2.5 py-1.5 rounded flex items-center gap-1.5 border ${
                      isDark
                        ? "text-amber-300 bg-amber-950/40 border-amber-800/60"
                        : "text-amber-800 bg-amber-50/80 border-amber-200/70"
                    }`}
                  >
                    <span>Document matches existing version. All {uploadResult.chunks_skipped} sections are already indexed & ready.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center gap-2 border ${
                isDark
                  ? "bg-rose-950/40 border-rose-900/50 text-rose-300"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{typeof uploadError === "string" ? uploadError : JSON.stringify(uploadError)}</span>
            </div>
          )}

          {/* Registered Documents Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center ${
                    isDark
                      ? "bg-zinc-800 border border-zinc-700/80 text-indigo-400"
                      : "bg-indigo-50 border border-indigo-100 text-indigo-600"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <h3
                  className={`text-sm font-bold flex items-center gap-1.5 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  <span>Indexed Documents</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                      isDark
                        ? "bg-zinc-800 text-zinc-200 border-zinc-700/80"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {documents.length}
                  </span>
                </h3>
                <span className={`hidden sm:inline text-xs select-none ${isDark ? "text-zinc-600" : "text-slate-300"}`}>•</span>
                <span className={`hidden sm:inline text-xs font-medium ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                  {totalSections} total indexed sections
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Filter Input */}
                {documents.length > 2 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter documents..."
                      className={`w-36 sm:w-44 pl-8 pr-6 py-1 text-xs border rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        isDark
                          ? "bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                          : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                      }`}
                    />
                    {searchFilter && (
                      <button
                        onClick={() => setSearchFilter("")}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isLoading || isRefreshing}
                  className={`text-xs flex items-center gap-1.5 font-medium px-2.5 py-1 rounded-lg border transition cursor-pointer shadow-2xs ${
                    isDark
                      ? "text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border-zinc-800"
                      : "text-slate-600 hover:text-slate-900 border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                  title="Refresh document registry"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 transition-transform ${
                      isRefreshing || isLoading ? "animate-spin text-indigo-400" : ""
                    }`}
                  />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>

            {documents.length === 0 ? (
              <div
                className={`p-8 text-center text-xs rounded-xl border ${
                  isDark
                    ? "bg-zinc-950 border-zinc-800 text-zinc-400"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                No documents uploaded yet. Upload your first policy document above.
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div
                className={`p-6 text-center text-xs rounded-xl border ${
                  isDark
                    ? "bg-zinc-950 border-zinc-800 text-zinc-400"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              >
                No documents matching "{searchFilter}".
              </div>
            ) : (
              <div
                className={`divide-y border rounded-xl overflow-hidden shadow-2xs ${
                  isDark
                    ? "divide-zinc-800 border-zinc-800 bg-zinc-900"
                    : "divide-slate-100 border-slate-200 bg-white"
                }`}
              >
                {filteredDocuments.map((doc) => {
                  const isDefaultDoc =
                    Boolean(doc.is_default) ||
                    doc.document_id === "00000000-0000-0000-0000-000000000002" ||
                    doc.file_name === "WorkPilot_Company_Policy.pdf";
                  const fileConfig = getFileTypeConfig(doc.file_name, doc.file_type, isDark);

                  return (
                    <div
                      key={doc.document_id}
                      onClick={() => handleViewDoc(doc)}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors cursor-pointer group ${
                        isDark ? "hover:bg-zinc-800/60" : "hover:bg-slate-50/80"
                      }`}
                      title={`Click to view ${doc.file_name}`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* File Type Icon */}
                        <div
                          className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs group-hover:scale-105 transition-transform ${fileConfig.iconClass}`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs sm:text-sm font-semibold truncate transition-colors ${
                                isDark
                                  ? "text-white group-hover:text-indigo-400"
                                  : "text-slate-900 group-hover:text-indigo-600"
                              }`}
                            >
                              {doc.file_name}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(
                                doc.status
                              )}`}
                            >
                              {doc.status}
                            </span>
                          </div>

                          {/* Metadata Row: Sections, Type, Indexed Date, and Updated Date */}
                          <div
                            className={`flex items-center gap-2 mt-1 text-[11px] flex-wrap ${
                              isDark ? "text-zinc-400" : "text-slate-500"
                            }`}
                          >
                            {/* Sections count */}
                            <span className={`font-medium ${isDark ? "text-zinc-300" : "text-slate-600"}`}>
                              {doc.chunk_count} {doc.chunk_count === 1 ? "section" : "sections"}
                            </span>

                            <span className={`select-none ${isDark ? "text-zinc-600" : "text-slate-300"}`}>•</span>

                            {/* File format */}
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border uppercase ${fileConfig.badgeClass}`}
                            >
                              {fileConfig.label}
                            </span>

                            <span className={`select-none ${isDark ? "text-zinc-600" : "text-slate-300"}`}>•</span>

                            {/* Indexed Date */}
                            <span
                              className="inline-flex items-center gap-1"
                              title={
                                doc.created_at
                                  ? `Indexed on ${formatFullDateTime(doc.created_at)}`
                                  : "First indexed timestamp"
                              }
                            >
                              <Calendar className="w-3 h-3 text-indigo-400 shrink-0" />
                              <span>Indexed: {formatDate(doc.created_at || doc.updated_at)}</span>
                            </span>

                            <span className={`select-none ${isDark ? "text-zinc-600" : "text-slate-300"}`}>•</span>

                            {/* Updated Date */}
                            <span
                              className="inline-flex items-center gap-1"
                              title={
                                doc.updated_at
                                  ? `Last updated on ${formatFullDateTime(doc.updated_at)}`
                                  : "Last updated timestamp"
                              }
                            >
                              <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                              <span>Updated: {formatDate(doc.updated_at || doc.created_at)}</span>
                              {doc.updated_at && formatTime(doc.updated_at) ? (
                                <span className={isDark ? "text-zinc-500" : "text-slate-400"}>
                                  ({formatTime(doc.updated_at)})
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Area */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isDefaultDoc ? (
                          <span
                            onClick={(e) => e.stopPropagation()}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium border select-none shrink-0 ${
                              isDark
                                ? "text-zinc-400 bg-zinc-950 border-zinc-800"
                                : "text-slate-400 bg-slate-50 border-slate-200"
                            }`}
                            title="Default company policy document is protected and cannot be deleted."
                          >
                            <Lock className="w-3 h-3 text-slate-400" />
                            <span className="hidden sm:inline">Protected</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(doc.document_id, doc.file_name);
                            }}
                            className={`p-1.5 rounded-lg transition cursor-pointer shrink-0 ${
                              isDark
                                ? "text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
                                : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            }`}
                            title="Remove document from knowledge base"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <ChevronRight
                          className={`w-4 h-4 transition-colors shrink-0 ${
                            isDark ? "text-zinc-600 group-hover:text-zinc-400" : "text-slate-300 group-hover:text-slate-500"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3.5 border-t flex justify-between items-center text-xs ${
            isDark
              ? "bg-zinc-900 border-zinc-800 text-zinc-400"
              : "bg-slate-50 border-slate-200 text-slate-500"
          }`}
        >
          <span
            className={`inline-flex items-center gap-1.5 font-medium ${
              isDark ? "text-zinc-300" : "text-slate-600"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Documents are indexed and ready for AI Assistant search
          </span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer shadow-xs active:scale-95 ${
              isDark
                ? "bg-white text-zinc-950 hover:bg-zinc-100 font-semibold"
                : "bg-slate-900 text-white hover:bg-slate-800"
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
