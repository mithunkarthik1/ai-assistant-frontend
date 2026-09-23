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
import { getPolicyPages, getPolicyPdfUrl } from "../../services/chatService";

export default function PolicyHandbookModal({
  isOpen,
  onClose,
  initialPage = 1,
  highlightText = "",
}) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("reader"); // "reader" | "raw_pdf"
  const [selectedPage, setSelectedPage] = useState(initialPage);
  const pageRefs = useRef({});

  const pdfUrl = getPolicyPdfUrl();

  // Load structured pages once
  useEffect(() => {
    async function loadPages() {
      try {
        setLoading(true);
        const data = await getPolicyPages();
        setPages(data.pages || []);
      } catch (err) {
        console.error("Failed to load policy pages:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isOpen && pages.length === 0) {
      loadPages();
    }
  }, [isOpen, pages.length]);

  // Sync selected page with initialPage
  useEffect(() => {
    if (isOpen && initialPage) {
      setSelectedPage(initialPage);
      if (activeTab === "reader" && pageRefs.current[initialPage]) {
        setTimeout(() => {
          pageRefs.current[initialPage]?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 200);
      }
    }
  }, [isOpen, initialPage, activeTab]);

  // Auto-scroll to initial page when opened
  useEffect(() => {
    if (!loading && isOpen && selectedPage && pageRefs.current[selectedPage] && activeTab === "reader") {
      setTimeout(() => {
        pageRefs.current[selectedPage]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 250);
    }
  }, [loading, isOpen, selectedPage, activeTab]);

  // Filter & match counts
  const filteredMatches = useMemo(() => {
    if (!searchQuery.trim()) return {};
    const query = searchQuery.toLowerCase().trim();
    const matches = {};

    pages.forEach((p) => {
      let count = 0;
      p.sections.forEach((sec) => {
        if (sec.title.toLowerCase().includes(query)) count++;
        if (sec.intro && sec.intro.toLowerCase().includes(query)) count++;
        sec.bullets.forEach((b) => {
          if (b.toLowerCase().includes(query)) count++;
        });
      });
      if (count > 0) {
        matches[p.page] = count;
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
    if (!searchQuery.trim()) return text;
    const query = searchQuery.trim();
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-amber-200 text-amber-950 font-medium px-0.5 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
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
                WorkPilot Official Policy Handbook
                <span className="hidden sm:inline-block text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-full">
                  Verified PDF • 5 Pages
                </span>
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Search, browse, or view the complete official PDF documentation
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
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

          {/* Search Box (in reader mode) */}
          {activeTab === "reader" && (
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search policy clauses (e.g. internet, yoga, gym, leave)..."
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
            {[1, 2, 3, 4, 5].map((pageNum) => {
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
                  {matchCount && (
                    <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-900 text-[10px] font-bold inline-flex items-center justify-center">
                      {matchCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content View Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/50">
          {activeTab === "raw_pdf" ? (
            <div className="w-full h-full min-h-[550px] bg-white rounded-xl overflow-hidden border border-slate-200 flex flex-col shadow-xs">
              <div className="px-4 py-2 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-medium text-slate-800">
                    WorkPilot_Company_Policy.pdf • Page {selectedPage} of 5
                  </span>
                </div>
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
              <div className="flex-1 w-full min-h-[500px]">
                <object
                  key={`pdf-obj-${selectedPage}`}
                  data={`${pdfUrl}#page=${selectedPage}`}
                  type="application/pdf"
                  className="w-full h-full min-h-[520px]"
                >
                  <iframe
                    src={`${pdfUrl}#page=${selectedPage}`}
                    title="WorkPilot Official Policy Handbook PDF"
                    className="w-full h-full min-h-[520px] border-none"
                  >
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-600">
                      <FileText className="w-10 h-10 text-indigo-400 mb-2" />
                      <p className="font-semibold text-slate-800 text-sm mb-1">
                        Viewing Policy PDF
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
              <p className="text-xs">Loading Policy Handbook pages...</p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {pages.map((pageData) => (
                <div
                  key={pageData.page}
                  ref={(el) => (pageRefs.current[pageData.page] = el)}
                  className={`bg-white rounded-xl border p-5 sm:p-7 shadow-xs transition-all duration-300 ${
                    selectedPage === pageData.page
                      ? "ring-2 ring-indigo-500/40 border-indigo-300 shadow-md"
                      : "border-slate-200/90"
                  }`}
                >
                  {/* Page Card Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center justify-center border border-indigo-200/60">
                        {pageData.page}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                        WorkPilot Policy Documentation • Page {pageData.page} of 5
                      </span>
                    </div>
                    {filteredMatches[pageData.page] && (
                      <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                        {filteredMatches[pageData.page]} match(es)
                      </span>
                    )}
                  </div>

                  {/* Sections inside this page */}
                  <div className="space-y-6">
                    {pageData.sections.map((sec) => (
                      <div key={sec.num} className="space-y-2.5">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="text-indigo-600">§ {sec.num}.</span>
                          <span>{highlightTextContent(sec.title)}</span>
                        </h3>

                        {sec.intro && (
                          <p className="text-xs sm:text-sm text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
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
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Document: WorkPilot_Company_Policy.pdf</span>
          </div>
          <span className="hidden sm:inline text-slate-400">
            Click any section or page pill above to navigate instantly
          </span>
        </div>
      </div>
    </div>
  );
}
