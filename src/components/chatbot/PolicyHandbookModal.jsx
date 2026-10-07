import { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Search,
  FileText,
  Download,
  ExternalLink,
  ChevronRight,
  BookOpen,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { getDocumentPages, getPolicyPdfUrl } from "../../services/chatService";

function parseDocumentBlocks(rawText) {
  if (!rawText) return [];

  // Normalize line endings and extra horizontal whitespace
  let text = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  text = text.replace(/[ \t]+/g, " ");

  const rawLines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) return [];

  const blocks = [];
  let currentWords = [];
  let currentType = "p"; // "p" | "heading" | "bullet"

  const flush = () => {
    if (currentWords.length > 0) {
      const combined = currentWords.join(" ").trim();
      if (combined) {
        blocks.push({ type: currentType, text: combined });
      }
      currentWords = [];
      currentType = "p";
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];

    // Standalone bullet markers
    if (["●", "○", "•", "■", "◆", "►"].includes(line)) {
      flush();
      currentType = "bullet";
      continue;
    }

    const isBullet = /^[●○•■◆►\-\*]\s/.test(line) || /^\d+[\.\)]\s/.test(line);
    const trimmedColon = line.replace(/[:.]/g, "").toLowerCase().trim();
    const invalidHeadingWords = ["are", "is", "was", "were", "ex", "eg", "note", "case", "such as", "as follows", "1", "2", "3", "4", "5"];
    const isHeading =
      (line.endsWith(":") && line.split(" ").length <= 8 && !invalidHeadingWords.includes(trimmedColon) && trimmedColon.length >= 3) ||
      /^(?:Section|Article|Chapter|Part)\s+\d+/i.test(line);

    if (isBullet) {
      flush();
      currentType = "bullet";
      const cleanLine = line.replace(/^[●○•■◆►\-\*]\s*/, "");
      if (cleanLine) currentWords.push(cleanLine);
    } else if (isHeading) {
      flush();
      blocks.push({ type: "heading", text: line });
    } else {
      currentWords.push(line);
    }
  }

  flush();
  return blocks;
}

export default function PolicyHandbookModal({
  isOpen,
  onClose,
  initialPage = 1,
  highlightText = "",
  targetSection = null,
  targetTopic = null,
  documentId = "00000000-0000-0000-0000-000000000002",
  documentName = "WorkPilot_Company_Policy.pdf",
  isDefault = true,
}) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("reader"); // "reader" | "raw_pdf"
  const [selectedPage, setSelectedPage] = useState(initialPage);
  const [focusedSectionId, setFocusedSectionId] = useState(null);
  const pageRefs = useRef({});
  const loadedDocIdRef = useRef(null);

  const pdfUrl = getPolicyPdfUrl();

  // Reset tab to reader if not default policy
  useEffect(() => {
    if (!isDefault) {
      setActiveTab("reader");
    }
  }, [isDefault, documentId]);

  // Load structured pages when modal opens or document changes
  useEffect(() => {
    async function loadPages() {
      try {
        setLoading(true);
        const data = await getDocumentPages(documentId);
        setPages(data.pages || []);
        loadedDocIdRef.current = documentId;
      } catch (err) {
        console.error("Failed to load document pages:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isOpen && (loadedDocIdRef.current !== documentId || pages.length === 0)) {
      loadPages();
    }
  }, [isOpen, documentId]);

  // Extract all topics and sections across pages for quick navigation
  const allTopics = useMemo(() => {
    const list = [];
    pages.forEach((p, pIdx) => {
      const pageNum = p.page || p.page_number || pIdx + 1;
      if (Array.isArray(p.sections) && p.sections.length > 0 && typeof p.sections[0] === "object") {
        p.sections.forEach((sec) => {
          list.push({
            pageNum,
            num: sec.num,
            title: sec.title,
            id: `section-num-${sec.num}`,
            label: `§ ${sec.num}. ${sec.title}`,
          });
        });
      } else {
        const pageText = p.content || (p.chunks ? p.chunks.map((c) => c.content).join("\n\n") : "");
        const blocks = parseDocumentBlocks(pageText);
        blocks.forEach((b, bIdx) => {
          if (b.type === "heading") {
            const cleanT = b.text.replace(/[:.]/g, "").trim();
            list.push({
              pageNum,
              title: cleanT,
              id: `block-${pageNum}-${bIdx}`,
              label: cleanT,
            });
          }
        });
      }
    });
    return list;
  }, [pages]);

  // Helper to jump to a specific topic
  const jumpToTopic = (topicItem) => {
    setSelectedPage(topicItem.pageNum);
    if (activeTab !== "reader") {
      setActiveTab("reader");
    }
    setTimeout(() => {
      const el = document.getElementById(topicItem.id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setFocusedSectionId(topicItem.id);
        setTimeout(() => setFocusedSectionId(null), 3500);
      } else if (pageRefs.current[topicItem.pageNum]) {
        pageRefs.current[topicItem.pageNum]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 180);
  };

  // Sync selected page with initialPage
  useEffect(() => {
    if (isOpen && initialPage) {
      setSelectedPage(initialPage);
    }
  }, [isOpen, initialPage, documentId]);

  // Auto-scroll to targeted section or initial page when opened
  useEffect(() => {
    if (isOpen && !loading && pages.length > 0) {
      if (targetSection || targetTopic) {
        const queryTerm = (targetSection || targetTopic || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const matched = allTopics.find((t) => {
          const cleanTitle = t.title.toLowerCase().replace(/[^a-z0-9]/g, "");
          return (
            cleanTitle.includes(queryTerm) ||
            queryTerm.includes(cleanTitle) ||
            (t.num && String(targetSection).includes(String(t.num)))
          );
        });

        if (matched) {
          jumpToTopic(matched);
          return;
        }

        // Fallback: if not matched in allTopics, scroll to initialPage and center on target heading
        if (initialPage && pageRefs.current[initialPage]) {
          setSelectedPage(initialPage);
          setTimeout(() => {
            const targetEl = document.querySelector(`[data-target-heading="true"]`);
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
              pageRefs.current[initialPage]?.scrollIntoView({ behavior: "smooth", block: "start" });
            }
          }, 240);
          return;
        }
      }

      // Fallback: scroll to initial page
      if (initialPage && pageRefs.current[initialPage] && activeTab === "reader") {
        setTimeout(() => {
          pageRefs.current[initialPage]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 220);
      }
    }
  }, [isOpen, loading, targetSection, targetTopic, initialPage, allTopics]);

  // Filter & match counts
  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return {};
    const query = searchQuery.toLowerCase().trim();
    const matches = {};

    pages.forEach((p) => {
      const pageNum = p.page || p.page_number || 1;
      let count = 0;

      // Format 1: Structured sections with bullets (default handbook)
      if (Array.isArray(p.sections) && p.sections.length > 0 && typeof p.sections[0] === "object") {
        p.sections.forEach((sec) => {
          if (sec.title && sec.title.toLowerCase().includes(query)) count++;
          if (sec.intro && sec.intro.toLowerCase().includes(query)) count++;
          (sec.bullets || []).forEach((b) => {
            if (b.toLowerCase().includes(query)) count++;
          });
        });
      } else {
        // Format 2: Uploaded document (chunks or raw content)
        if (p.title && p.title.toLowerCase().includes(query)) count++;
        if (Array.isArray(p.sections)) {
          p.sections.forEach((s) => {
            if (typeof s === "string" && s.toLowerCase().includes(query)) count++;
          });
        }
        if (Array.isArray(p.chunks)) {
          p.chunks.forEach((chk) => {
            if (chk.content && chk.content.toLowerCase().includes(query)) count++;
            if (chk.section && chk.section.toLowerCase().includes(query)) count++;
          });
        } else if (p.content && p.content.toLowerCase().includes(query)) {
          const occ = (p.content.toLowerCase().match(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
          count += occ;
        }
      }

      if (count > 0) {
        matches[pageNum] = count;
      }
    });

    return matches;
  }, [pages, searchQuery]);

  const scrollToPage = (pageNum) => {
    setSelectedPage(pageNum);
    if (activeTab === "reader") {
      pageRefs.current[pageNum]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  // Helper to highlight matching text
  const highlightTextContent = (text) => {
    if (!text) return "";
    const activeQuery = (searchQuery.trim() || highlightText.trim()).trim();
    if (!activeQuery) return text;

    const words = activeQuery
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !["the", "and", "for", "with", "from", "policy", "doc", "document"].includes(w.toLowerCase()));

    const termsToMatch = Array.from(new Set([activeQuery, ...words])).filter(Boolean);
    const pattern = termsToMatch
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("|");

    if (!pattern) return text;

    const parts = String(text).split(new RegExp(`(${pattern})`, "gi"));
    return parts.map((part, i) => {
      const isMatch = termsToMatch.some((t) => t.toLowerCase() === part.toLowerCase());
      return isMatch ? (
        <mark key={i} className="bg-amber-200 text-amber-950 font-semibold px-0.5 rounded shadow-2xs">
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[880px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-2">
                {isDefault ? "WorkPilot Official Policy Handbook" : `${documentName} Handbook`}
                <span className="hidden sm:inline-block text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                  {isDefault ? "Verified PDF • 5 Pages" : `Document Handbook • ${pages.length} Pages`}
                </span>
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                {isDefault
                  ? "Search, browse, or view the complete official PDF documentation"
                  : `Browse and search verified contents from ${documentName}`}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {isDefault && (
              <>
                <a
                  href={`${pdfUrl}#page=${selectedPage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 rounded-lg transition-colors shadow-2xs"
                  title="Open full PDF in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF</span>
                </a>
                <a
                  href={pdfUrl}
                  download="WorkPilot_Company_Policy.pdf"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-200/70 rounded-lg transition-colors"
                  title="Download PDF file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Download</span>
                </a>
              </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
              aria-label="Close handbook modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Search, Mode Switcher & Page Navigation */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 px-4 sm:px-6 py-2.5 border-b border-slate-100 bg-white">
          {/* Mode Switcher */}
          {isDefault ? (
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-medium shrink-0 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab("reader")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === "reader"
                    ? "bg-white text-indigo-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📖 Interactive Reader
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("raw_pdf")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === "raw_pdf"
                    ? "bg-white text-indigo-700 shadow-xs font-semibold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📄 Original PDF Viewer
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 shrink-0 self-start md:self-auto">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Interactive Reader</span>
            </div>
          )}

          {/* Search Box (in reader mode) */}
          {activeTab === "reader" && (
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${documentName}...`}
                className="w-full pl-9 pr-8 py-1 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Page Jump Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs text-slate-400 mr-1 font-medium hidden lg:inline">
              Pages:
            </span>
            {pages.map((p, idx) => {
              const pageNum = p.page || p.page_number || idx + 1;
              const matchCount = activeTab === "reader" ? filteredMatches[pageNum] : null;
              const isSelected = selectedPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => scrollToPage(pageNum)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer flex items-center gap-1 whitespace-nowrap ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <span>Page {pageNum}</span>
                  {matchCount ? (
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold inline-flex items-center justify-center">
                      {matchCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>


        {/* Content View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {activeTab === "raw_pdf" && isDefault ? (
            <div className="w-full h-full min-h-[550px] bg-white rounded-xl overflow-hidden border border-slate-200 flex flex-col shadow-xs">
              <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="font-bold text-slate-800">
                    WorkPilot_Company_Policy.pdf
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                    Viewing Page {selectedPage} of 5
                  </span>
                </div>

                {/* Topics on this page */}
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline">
                    Topics on Page {selectedPage}:
                  </span>
                  {allTopics
                    .filter((t) => t.pageNum === selectedPage)
                    .map((t, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => jumpToTopic(t)}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50 transition cursor-pointer"
                        title="Click to view structured clause in Interactive Reader"
                      >
                        § {t.num}. {t.title}
                      </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`${pdfUrl}#page=${selectedPage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Open in Browser Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <div className="flex-1 w-full min-h-[500px]">
                <object
                  key={`pdf-obj-${selectedPage}`}
                  data={`${pdfUrl}#page=${selectedPage}`}
                  type="application/pdf"
                  className="w-full h-full min-h-[520px]"
                >
                  <iframe
                    key={`pdf-frame-${selectedPage}`}
                    src={`${pdfUrl}#page=${selectedPage}`}
                    title="WorkPilot Official Policy Handbook PDF"
                    className="w-full h-full min-h-[520px] border-none"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-600">
                      <FileText className="w-10 h-10 text-indigo-400 mb-2" />
                      <p className="font-semibold text-slate-800 text-sm mb-1">
                        Viewing Policy PDF (Page {selectedPage})
                      </p>
                      <p className="text-xs text-slate-500 mb-3">
                        If your browser does not render inline PDFs, click below to open it:
                      </p>
                      <a
                        href={`${pdfUrl}#page=${selectedPage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-lg inline-flex items-center gap-2 shadow-xs transition"
                      >
                        <ExternalLink className="w-4 h-4" /> Open Full PDF in New Tab
                      </a>
                    </div>
                  </iframe>
                </object>
              </div>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs">Loading {documentName} pages...</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {pages.map((pageData, pIdx) => {
                const pageNum = pageData.page || pageData.page_number || pIdx + 1;
                const isDefaultFormat =
                  Array.isArray(pageData.sections) &&
                  pageData.sections.length > 0 &&
                  typeof pageData.sections[0] === "object" &&
                  pageData.sections[0].bullets;

                return (
                  <div
                    key={pageNum}
                    ref={(el) => (pageRefs.current[pageNum] = el)}
                    className={`bg-white rounded-xl border p-5 sm:p-7 shadow-xs transition-all duration-300 ${
                      selectedPage === pageNum
                        ? "ring-2 ring-indigo-500/40 border-indigo-300 shadow-md"
                        : "border-slate-200/90"
                    }`}
                  >
                    {/* Page Card Header */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-200/60">
                          {pageNum}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                          {documentName} • Page {pageNum} of {pages.length}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isDefault && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPage(pageNum);
                              setActiveTab("raw_pdf");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 rounded-md transition-all cursor-pointer shadow-2xs"
                            title={`Switch to Page ${pageNum} in PDF viewer`}
                          >
                            <FileText className="w-3 h-3 text-indigo-600" />
                            <span>View Page {pageNum} in PDF</span>
                          </button>
                        )}
                        {filteredMatches[pageNum] && (
                          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            {filteredMatches[pageNum]} match(es)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Format A: Structured bullets (Default Handbook) */}
                    {isDefaultFormat ? (
                      <div className="space-y-6">
                        {pageData.sections.map((sec) => {
                          const secId = `section-num-${sec.num}`;
                          const isTarget = focusedSectionId === secId;

                          return (
                            <div
                              key={sec.num}
                              id={secId}
                              data-section-title={sec.title}
                              className={`p-4 rounded-xl transition-all duration-500 ${
                                isTarget
                                  ? "bg-indigo-50/80 border-2 border-indigo-500 ring-4 ring-indigo-200/70 shadow-md"
                                  : "bg-slate-50/50 border border-slate-100 hover:border-slate-200"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                                  <span className="text-indigo-600 font-extrabold">§ {sec.num}.</span>
                                  <span>{highlightTextContent(sec.title)}</span>
                                  {isTarget && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-xs animate-pulse">
                                      🎯 Selected Topic
                                    </span>
                                  )}
                                </h3>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPage(pageNum);
                                      setActiveTab("raw_pdf");
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white transition cursor-pointer"
                                    title="View this topic in official PDF"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                  <a
                                    href={`${pdfUrl}#page=${pageNum}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-white transition"
                                    title="Open this topic's page in new browser tab"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>

                              {sec.intro && (
                                <p className="text-xs sm:text-sm text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200/70 mb-3">
                                  {highlightTextContent(sec.intro)}
                                </p>
                              )}

                              <ul className="space-y-2">
                                {sec.bullets.map((b, idx) => {
                                  const hasColon = b.includes(":");
                                  if (hasColon) {
                                    const [label, val] = b.split(":", 1);
                                    const rest = b.substring(label.length + 1);
                                    return (
                                      <li
                                        key={idx}
                                        className="text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-2"
                                      >
                                        <span className="text-indigo-500 font-bold mt-0.5 shrink-0">
                                          •
                                        </span>
                                        <div>
                                          <strong className="font-semibold text-slate-900">
                                            {highlightTextContent(label.trim())}:
                                          </strong>{" "}
                                          {highlightTextContent(rest.trim())}
                                        </div>
                                      </li>
                                    );
                                  }
                                  return (
                                    <li
                                      key={idx}
                                      className="text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-2"
                                    >
                                      <span className="text-indigo-500 font-bold mt-0.5 shrink-0">
                                        •
                                      </span>
                                      <div>{highlightTextContent(b.trim())}</div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Format B: Uploaded document page rendered in normal PDF document format */
                      <div className="space-y-4">
                        {pageData.title && pageData.title !== `Page ${pageNum}` && (
                          <div className="font-bold text-slate-900 text-sm sm:text-base border-b border-slate-100 pb-2 mb-2">
                            {highlightTextContent(pageData.title)}
                          </div>
                        )}
                        <div className="space-y-2.5">
                          {(() => {
                            const pageText =
                              pageData.content ||
                              (pageData.chunks ? pageData.chunks.map((c) => c.content).join("\n\n") : "");
                            const blocks = parseDocumentBlocks(pageText);

                            if (blocks.length === 0) {
                              return (
                                <p className="text-xs sm:text-sm text-slate-500 italic">
                                  No textual content available on this page.
                                </p>
                              );
                            }

                            const queryTarget = (targetTopic || targetSection || highlightText || "").toLowerCase().trim();
                            const queryClean = queryTarget.replace(/[^a-z0-9]/g, "");
                            const targetTokens = queryTarget
                              .split(/\s+/)
                              .filter((w) => w.length > 2 && !["the", "and", "for", "with", "from", "policy"].includes(w));

                            return blocks.map((block, bIdx) => {
                              const blockId = `block-${pageNum}-${bIdx}`;
                              if (block.type === "heading") {
                                const headingClean = block.text.toLowerCase().replace(/[^a-z0-9]/g, "");
                                const isTargetHeading =
                                  Boolean(queryClean) &&
                                  (headingClean.includes(queryClean) ||
                                    queryClean.includes(headingClean) ||
                                    targetTokens.some((tok) => headingClean.includes(tok)));

                                return (
                                  <h4
                                    key={bIdx}
                                    id={blockId}
                                    data-target-heading={isTargetHeading ? "true" : undefined}
                                    className={`font-bold text-xs sm:text-sm pt-2.5 pb-2 px-3 rounded-xl border flex items-center justify-between gap-2 transition-all duration-500 my-2 ${
                                      isTargetHeading
                                        ? "bg-violet-100/90 border-2 border-violet-500 text-violet-950 ring-4 ring-violet-200/80 shadow-md"
                                        : "bg-transparent border-b border-slate-100 text-slate-900"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="w-1.5 h-3.5 bg-violet-600 rounded-full inline-block shrink-0" />
                                      <span>{highlightTextContent(block.text)}</span>
                                    </div>
                                    {isTargetHeading && (
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-600 text-white shadow-xs animate-pulse shrink-0">
                                        🎯 Referenced Topic
                                      </span>
                                    )}
                                  </h4>
                                );
                              }

                              if (block.type === "bullet") {
                                const isTargetBullet =
                                  targetTokens.length > 0 &&
                                  targetTokens.some((tok) => block.text.toLowerCase().includes(tok));

                                return (
                                  <div
                                    key={bIdx}
                                    id={blockId}
                                    className={`flex items-start gap-2 text-xs sm:text-sm leading-relaxed p-1.5 rounded-lg transition-all duration-300 ${
                                      isTargetBullet
                                        ? "bg-violet-50/90 border border-violet-200/90 ring-2 ring-violet-300/40 shadow-2xs text-slate-900"
                                        : "text-slate-700 pl-1"
                                    }`}
                                  >
                                    <span className="text-violet-600 font-bold shrink-0 mt-0.5 select-none">•</span>
                                    <div className="flex-1 leading-relaxed">
                                      {highlightTextContent(block.text)}
                                    </div>
                                    {isTargetBullet && (
                                      <span className="text-[10px] font-bold text-violet-700 bg-violet-100/80 px-1.5 py-0.5 rounded shrink-0">
                                        📍 Cited
                                      </span>
                                    )}
                                  </div>
                                );
                              }

                              return (
                                <p
                                  key={bIdx}
                                  id={blockId}
                                  className="text-xs sm:text-sm text-slate-800 leading-relaxed text-justify my-1"
                                >
                                  {highlightTextContent(block.text)}
                                </p>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Document: {documentName}</span>
          </div>
          <span className="hidden sm:inline text-slate-400">
            Click any section or page pill above to navigate instantly
          </span>
        </div>
      </div>
    </div>
  );
}
