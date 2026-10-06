import { useState, useEffect, useRef } from "react";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  X,
  RefreshCw,
  Layers,
  Hash,
  Clock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { uploadDocument, getDocuments, deleteDocument } from "../../services/chatService";

export default function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      fetchDocs();
      setUploadResult(null);
      setUploadError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
      setUploadError(`Unsupported file format. Please upload PDF, DOCX, or TXT.`);
      return;
    }

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
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Upload failed. Please check the file and try again.";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId, fileName) => {
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
      case "INDEXED":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "UPDATED":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "PROCESSING":
        return "bg-amber-100 text-amber-800 border-amber-300 animate-pulse";
      case "FAILED":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Incremental Document Indexing
              </h2>
              <p className="text-xs text-slate-400">
                Hybrid semantic chunking & zero-redundancy vector updates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Upload Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? "border-indigo-500 bg-indigo-50/60 scale-[1.01]"
                : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto mb-3 shadow-xs">
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              {isUploading ? "Extracting & Hybrid Chunking..." : "Click to select or drop document here"}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Supports PDF, Word (DOCX), and Text (TXT, MD) up to 25MB
            </p>

            {/* Progress bar */}
            {isUploading && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-2 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  {uploadProgress < 90 ? `Uploading (${uploadProgress}%)` : "Generating semantic embeddings & diffing..."}
                </p>
              </div>
            )}
          </div>

          {/* Success Banner with Detailed Incremental Stats */}
          {uploadResult && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs shadow-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Document Processed: {uploadResult.file_name}</span>
                <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(uploadResult.status)}`}>
                  {uploadResult.status}
                </span>
              </div>
              <p className="text-emerald-800 font-medium">{uploadResult.message}</p>

              {/* Incremental Breakdown Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100 text-center">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Total Chunks</span>
                  <span className="text-base font-extrabold text-slate-900">{uploadResult.total_chunks}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100 text-center">
                  <span className="block text-[10px] text-emerald-700 uppercase font-semibold">Added</span>
                  <span className="text-base font-extrabold text-emerald-600">+{uploadResult.chunks_added}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100 text-center">
                  <span className="block text-[10px] text-blue-700 uppercase font-semibold">Re-embedded</span>
                  <span className="text-base font-extrabold text-blue-600">{uploadResult.chunks_updated}</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg border border-emerald-100 text-center">
                  <span className="block text-[10px] text-slate-500 uppercase font-semibold">Skipped (0 cost)</span>
                  <span className="text-base font-extrabold text-slate-700">{uploadResult.chunks_skipped}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Registered Documents Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Indexed Document Registry ({documents.length})</span>
              </h3>
              <button
                onClick={fetchDocs}
                disabled={isLoading}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                No documents uploaded yet. Upload your first policy PDF above.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                {documents.map((doc) => (
                  <div
                    key={doc.document_id}
                    className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
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
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-400" />
                            <span>{doc.chunk_count} chunks</span>
                          </span>
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400">
                            <Hash className="w-3 h-3 text-slate-400" />
                            <span>{doc.file_hash.slice(0, 10)}...</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(doc.updated_at || doc.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(doc.document_id, doc.file_name)}
                      className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer shrink-0"
                      title="Delete document and purge vectors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 text-indigo-700 font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Incremental index compares stable SHA-256 chunk hashes
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
