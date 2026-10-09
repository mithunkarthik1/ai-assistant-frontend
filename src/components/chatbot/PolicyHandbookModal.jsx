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
  ArrowLeft,
  Image as ImageIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
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
  let currentType = "p"; // "p" | "heading" | "bullet" | "image_ocr"

  const flush = () => {
    if (currentWords.length > 0) {
      const combined = currentWords.join(currentType === "image_ocr" ? "\n" : " ").trim();
      if (combined) {
        blocks.push({ type: currentType, text: combined });
      }
      currentWords = [];
      currentType = "p";
    }
  };

  for (let i = 0; i < rawLines.length; i++) {
    let line = rawLines[i];

    // Embedded Image / Diagram OCR blocks
    if (line.includes("[Image / Diagram Content]") || line.startsWith("[Image Content]")) {
      flush();
      currentType = "image_ocr";
      const cleanLine = line.replace(/\[Image\s*(?:\/\s*Diagram\s*)?Content\]:?/i, "").trim();
      if (cleanLine) currentWords.push(cleanLine);
      continue;
    }

    if (currentType === "image_ocr") {
      const isHeadingLine = (line.endsWith(":") && line.split(" ").length <= 8) || /^(?:Section|Article|Chapter|Part|\d+\.)\s+/i.test(line);
      if (isHeadingLine && !line.includes("[Image")) {
        flush();
      } else {
        currentWords.push(line);
        continue;
      }
    }

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
  isDark = false,
}) {
  const [pages, setPages] = useState([]);
  const [docFileType, setDocFileType] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("reader"); // "reader" | "raw_pdf"
  const [selectedPage, setSelectedPage] = useState(initialPage);
  const [focusedSectionId, setFocusedSectionId] = useState(null);
  const pageRefs = useRef({});
  const scrollContainerRef = useRef(null);
  const loadedDocIdRef = useRef(null);

  const pdfUrl = getPolicyPdfUrl();

  // Reset tab to reader if not default policy
  useEffect(() => {
    if (!isDefault) {
      setActiveTab("reader");
    }
  }, [isDefault, documentId]);

  // Reset search query and focused section whenever modal opens, closes, or document changes
  useEffect(() => {
    setSearchQuery("");
    setFocusedSectionId(null);
  }, [isOpen, documentId]);

  // Load structured pages when modal opens or document changes
  useEffect(() => {
    async function loadPages() {
      try {
        setLoading(true);
        const data = await getDocumentPages(documentId);
        setPages(data.pages || []);
        setDocFileType(data.file_type || "");
        loadedDocIdRef.current = documentId;
      } catch (err) {
        console.error("Failed to load document pages:", err);
      } finally {
        setLoading(false);
      }
    }
    if (isOpen) {
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
            isBullet: false,
          });

          // Also index every bullet subtopic so topics like "Paternity Leave", "Full and Final Settlement", etc. can be jumped to directly!
          (sec.bullets || []).forEach((b, bIdx) => {
            if (b.includes(":")) {
              const [bLabel] = b.split(":", 1);
              const cleanLabel = bLabel.trim();
              if (cleanLabel.length >= 3) {
                list.push({
                  pageNum,
                  num: sec.num,
                  title: cleanLabel,
                  parentTitle: sec.title,
                  id: `section-${sec.num}-bullet-${bIdx}`,
                  parentSectionId: `section-num-${sec.num}`,
                  label: `${cleanLabel} (§ ${sec.num})`,
                  isBullet: true,
                });
              }
            }
          });
        });
      } else {
        const pageText = p.content || (p.chunks ? p.chunks.map((c) => c.content).join("\n\n") : "");
        const lines = pageText.split("\n");
        let foundMdHeadings = false;

        // 1. Extract markdown headings (#, ##, ###)
        lines.forEach((l) => {
          const m = l.match(/^(#{1,6})\s+(.+)$/);
          if (m) {
            foundMdHeadings = true;
            const level = m[1].length;
            const rawTitle = m[2].replace(/[*_`]/g, "").trim();
            const slug = rawTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            if (rawTitle.length >= 2 && !list.some((item) => item.pageNum === pageNum && item.title === rawTitle)) {
              list.push({
                pageNum,
                title: rawTitle,
                id: `heading-${slug}`,
                label: level <= 2 ? rawTitle : `• ${rawTitle}`,
                isBullet: level > 2,
              });
            }
          }
        });

        // 2. Fallback to parseDocumentBlocks if no markdown headings
        if (!foundMdHeadings) {
          const blocks = parseDocumentBlocks(pageText);
          blocks.forEach((b, bIdx) => {
            if (b.type === "heading") {
              const cleanT = b.text.replace(/[:.]/g, "").trim();
              const slug = cleanT.toLowerCase().replace(/[^a-z0-9]+/g, "-");
              list.push({
                pageNum,
                title: cleanT,
                id: `heading-${slug}`,
                label: cleanT,
                isBullet: false,
              });
            }
          });
        }

        // 3. Also index unique chunk topics from uploaded documents
        if (Array.isArray(p.chunks)) {
          p.chunks.forEach((chk) => {
            const topic = (chk.topic || chk.section || "").trim();
            const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            if (
              topic &&
              topic !== "General" &&
              topic !== "Overview" &&
              !list.some((item) => item.pageNum === pageNum && item.title === topic)
            ) {
              list.push({
                pageNum,
                title: topic,
                id: `heading-${slug}`,
                label: topic,
                isBullet: false,
              });
            }
          });
        }
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

    const doScroll = (retries = 0) => {
      const topicSlug = topicItem.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const el = document.getElementById(topicItem.id) ||
                 (topicSlug && document.getElementById(`heading-${topicSlug}`)) ||
                 (topicItem.parentSectionId && document.getElementById(topicItem.parentSectionId));
      const scrollContainer = scrollContainerRef.current;

      if (el && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        const targetScrollTop = elRect.top - containerRect.top + scrollContainer.scrollTop;
        scrollContainer.scrollTo({
          top: Math.max(0, targetScrollTop - 25),
          behavior: "smooth",
        });
        setFocusedSectionId(topicItem.id);
        setTimeout(() => setFocusedSectionId(null), 4000);
      } else if (pageRefs.current[topicItem.pageNum] && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const pageRect = pageRefs.current[topicItem.pageNum].getBoundingClientRect();
        const targetScrollTop = pageRect.top - containerRect.top + scrollContainer.scrollTop;
        scrollContainer.scrollTo({
          top: Math.max(0, targetScrollTop - 15),
          behavior: "smooth",
        });
        if (retries < 3) {
          setTimeout(() => doScroll(retries + 1), 120);
        }
      } else if (retries < 4) {
        setTimeout(() => doScroll(retries + 1), 120);
      }
    };

    setTimeout(() => doScroll(0), 120);
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
      const clean = (str) => String(str || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const topicClean = clean(targetTopic);
      const sectionClean = clean(targetSection);
      const highlightClean = clean(highlightText);

      // Extract section numbers if present (e.g. "3. Leave Policy" -> "3", "Section 4" -> "4")
      const extractSecNum = (str) => {
        const m = String(str || "").match(/(?:§\s*|Section\s+|Article\s+)?(\d+)/i);
        return m ? m[1] : null;
      };

      const topicSecNum = extractSecNum(targetTopic);
      const sectionSecNum = extractSecNum(targetSection);

      let matched = null;

      // 1. Try to match on targetTopic first (highest priority)
      if (topicClean) {
        // 1a. Exact or slug match on topic title
        matched = allTopics.find((t) => {
          const tClean = clean(t.title);
          return (
            tClean === topicClean ||
            (tClean.length >= 4 && topicClean.includes(tClean)) ||
            (topicClean.length >= 4 && tClean.includes(topicClean))
          );
        });

        // 1b. If topic specified a section number (e.g. "3. Leave Policy"), match section num
        if (!matched && topicSecNum) {
          matched = allTopics.find((t) => !t.isBullet && String(t.num) === topicSecNum);
        }
      }

      // 2. Try to match on targetSection (if not already matched)
      if (!matched && sectionClean) {
        // 2a. If section has a number (e.g. "4. Travel Policy" -> "4"), match that section
        if (sectionSecNum) {
          matched = allTopics.find((t) => !t.isBullet && String(t.num) === sectionSecNum);
        }
        // 2b. Match section title
        if (!matched) {
          matched = allTopics.find((t) => {
            const tClean = clean(t.title);
            return tClean === sectionClean || (tClean.length >= 4 && sectionClean.includes(tClean));
          });
        }
      }

      // 3. Try highlightText
      if (!matched && highlightClean) {
        matched = allTopics.find((t) => {
          const tClean = clean(t.title);
          return tClean.includes(highlightClean) || highlightClean.includes(tClean);
        });
      }

      if (matched) {
        jumpToTopic(matched);
        return;
      }

      // 4. Fallback: if initialPage specified, scroll directly to that page card
      if (initialPage && activeTab === "reader") {
        setSelectedPage(initialPage);
        setTimeout(() => {
          const scrollContainer = scrollContainerRef.current;
          if (pageRefs.current[initialPage] && scrollContainer) {
            const containerRect = scrollContainer.getBoundingClientRect();
            const pageRect = pageRefs.current[initialPage].getBoundingClientRect();
            const targetScrollTop = pageRect.top - containerRect.top + scrollContainer.scrollTop;
            scrollContainer.scrollTo({
              top: Math.max(0, targetScrollTop - 20),
              behavior: "smooth",
            });
          }
        }, 180);
      }
    }
  }, [isOpen, loading, targetSection, targetTopic, highlightText, initialPage, allTopics]);

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
      const el = pageRefs.current[pageNum];
      const scrollContainer = scrollContainerRef.current;
      if (el && scrollContainer) {
        const containerRect = scrollContainer.getBoundingClientRect();
        const pageRect = el.getBoundingClientRect();
        const targetScrollTop = pageRect.top - containerRect.top + scrollContainer.scrollTop;
        scrollContainer.scrollTo({
          top: Math.max(0, targetScrollTop - 20),
          behavior: "smooth",
        });
      } else if (el) {
        el.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }
  };

  // Helper to highlight matching text only when user explicitly searches in the reader search box
  const highlightTextContent = (text) => {
    if (!text) return "";
    const activeQuery = searchQuery.trim();
    if (!activeQuery) return text; // Clean, natural reading when browsing or jumping to pages

    const pattern = activeQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = String(text).split(new RegExp(`(${pattern})`, "gi"));
    return parts.map((part, i) => {
      const isMatch = part.toLowerCase() === activeQuery.toLowerCase();
      return isMatch ? (
        <mark key={i} className="bg-amber-200 text-amber-950 font-semibold px-0.5 rounded shadow-2xs">
          {part}
        </mark>
      ) : (
        part
      );
    });
  };

  const handleClose = () => {
    setSearchQuery("");
    setFocusedSectionId(null);
    if (onClose) onClose();
  };

  // Close smoothly on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{ zIndex: 80 }}
      className={`fixed inset-0 flex items-start justify-center pt-16 sm:pt-20 pb-4 sm:pb-6 px-3 sm:px-6 backdrop-blur-md animate-in fade-in duration-200 overflow-hidden ${
        isDark ? "bg-black/80" : "bg-slate-900/60"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-5xl h-[calc(100vh-5rem)] sm:h-[calc(100vh-6.25rem)] max-h-[860px] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          isDark
            ? "bg-zinc-900 border-zinc-800 text-zinc-100 shadow-2xl"
            : "bg-white border-slate-200 text-slate-800"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div
          className={`flex items-center justify-between px-4 sm:px-6 py-3 border-b transition-colors duration-300 ${
            isDark ? "border-zinc-800 bg-zinc-900 text-white" : "border-slate-200 bg-slate-50/90 text-slate-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2
                className={`text-sm sm:text-base font-semibold flex items-center gap-2 ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                {isDefault ? "Company Policy Handbook" : documentName}
                <span
                  className={`hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                    isDark
                      ? "bg-indigo-950/50 text-indigo-300 border-indigo-800/60"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200/70"
                  }`}
                >
                  {isDefault ? "Verified PDF • 5 Pages" : `Document Handbook • ${pages.length} ${pages.length === 1 ? "Page" : "Pages"}`}
                </span>
              </h2>
              <p className={`text-xs hidden sm:block ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                {isDefault
                  ? "Search, browse, or view the complete official PDF documentation"
                  : `Browse and search verified contents from ${documentName}`}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {!isDefault && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  window.dispatchEvent(new CustomEvent("open-document-upload"));
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-2xs cursor-pointer ${
                  isDark
                    ? "bg-zinc-800 text-zinc-200 hover:text-white hover:bg-zinc-700 border-zinc-700"
                    : "bg-slate-100 text-slate-700 hover:text-slate-900 hover:bg-slate-200 border-slate-200"
                }`}
                title="Return to Document Knowledge Base"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to Documents</span>
              </button>
            )}
            {isDefault && (
              <>
                <a
                  href={`${pdfUrl}#page=${selectedPage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors border shadow-2xs ${
                    isDark
                      ? "bg-indigo-950/60 text-indigo-300 hover:text-white hover:bg-indigo-900 border-indigo-800/70"
                      : "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-900 border-indigo-200/80"
                  }`}
                  title="Open full PDF in new browser tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open PDF</span>
                </a>
                <a
                  href={pdfUrl}
                  download="WorkPilot_Company_Policy.pdf"
                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    isDark
                      ? "text-zinc-300 hover:text-white hover:bg-zinc-800"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/70"
                  }`}
                  title="Download PDF file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Download</span>
                </a>
              </>
            )}
            <button
              onClick={handleClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark
                  ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-200/70"
              }`}
              aria-label="Close handbook modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-bar: Search, Mode Switcher & Page Navigation */}
        <div
          className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 px-4 sm:px-6 py-2.5 border-b transition-colors ${
            isDark ? "border-zinc-800 bg-zinc-950" : "border-slate-100 bg-white"
          }`}
        >
          {/* Mode Switcher */}
          {isDefault ? (
            <div
              className={`inline-flex p-0.5 rounded-lg border text-xs font-medium shrink-0 self-start md:self-auto ${
                isDark ? "bg-zinc-900 border-zinc-800" : "bg-slate-100 border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveTab("reader")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  activeTab === "reader"
                    ? isDark
                      ? "bg-zinc-800 text-white shadow-xs font-semibold"
                      : "bg-white text-indigo-700 shadow-xs font-semibold"
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-200"
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
                    ? isDark
                      ? "bg-zinc-800 text-white shadow-xs font-semibold"
                      : "bg-white text-indigo-700 shadow-xs font-semibold"
                    : isDark
                    ? "text-zinc-400 hover:text-zinc-200"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                📄 Original PDF Viewer
              </button>
            </div>
          ) : (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-semibold shrink-0 self-start md:self-auto ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 text-zinc-200"
                  : "bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
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
                className={`w-full pl-9 pr-8 py-1 text-xs sm:text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                  isDark
                    ? "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-500"
                    : "bg-slate-50 border-slate-200 text-slate-800 placeholder:text-slate-400"
                }`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Quick Page Jump Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            <span className={`text-xs mr-1 font-medium hidden lg:inline ${isDark ? "text-zinc-400" : "text-slate-400"}`}>
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
                      ? isDark
                        ? "bg-white text-zinc-950 font-bold shadow-xs"
                        : "bg-indigo-600 text-white shadow-xs"
                      : isDark
                      ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700"
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

        {/* Topics strip in reader mode */}
        {activeTab === "reader" && allTopics.length > 0 && (
          <div
            className={`flex items-center gap-2 overflow-x-auto px-4 sm:px-6 py-1.5 border-b text-xs shrink-0 ${
              isDark ? "bg-zinc-950 border-zinc-800" : "bg-slate-100/80 border-slate-200"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                isDark ? "text-zinc-400" : "text-slate-500"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
              Topics:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
              {allTopics
                .filter((t) => !t.isBullet || t.pageNum === selectedPage)
                .slice(0, 18)
                .map((t, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => jumpToTopic(t)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer shrink-0 border shadow-2xs ${
                      selectedPage === t.pageNum
                        ? isDark
                          ? "bg-zinc-800 text-indigo-300 border-indigo-700/80"
                          : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                        : isDark
                        ? "bg-zinc-900 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white"
                        : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:border-slate-300"
                    }`}
                    title={`Jump to ${t.title} on Page ${t.pageNum}`}
                  >
                    {t.label || t.title}
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Content View Area */}
        <div
          ref={scrollContainerRef}
          className={`flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 ${
            isDark ? "bg-zinc-950" : "bg-slate-50/50"
          }`}
        >
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
                    .filter((t) => t.pageNum === selectedPage && !t.isBullet)
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
                    title="Company Policy Handbook PDF"
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
                    className={`rounded-xl border p-5 sm:p-7 shadow-xs transition-all duration-300 ${
                      isDark
                        ? "bg-zinc-900 border-zinc-800 text-zinc-100 shadow-xl"
                        : "bg-white border-slate-200/90 text-slate-800"
                    } ${
                      selectedPage === pageNum
                        ? "ring-2 ring-indigo-500/40 border-indigo-400 shadow-md"
                        : ""
                    }`}
                  >
                    {/* Page Card Header */}
                    <div className={`flex items-center justify-between pb-3 mb-4 border-b ${isDark ? "border-zinc-800" : "border-slate-100"}`}>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-md text-xs font-bold flex items-center justify-center border ${
                            isDark
                              ? "bg-indigo-950/60 text-indigo-400 border-indigo-800/80"
                              : "bg-indigo-50 text-indigo-700 border-indigo-200/60"
                          }`}
                        >
                          {pageNum}
                        </span>
                        <span className={`text-xs font-semibold tracking-wider uppercase ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
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
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer shadow-2xs border ${
                              isDark
                                ? "text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900 border-indigo-800/80"
                                : "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200/80"
                            }`}
                            title={`Switch to Page ${pageNum} in PDF viewer`}
                          >
                            <FileText className="w-3 h-3 text-indigo-400" />
                            <span>View Page {pageNum} in PDF</span>
                          </button>
                        )}
                        {filteredMatches[pageNum] && (
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${
                            isDark
                              ? "text-amber-300 bg-amber-950/60 border-amber-800/60"
                              : "text-amber-800 bg-amber-50 border-amber-200"
                          }`}>
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
                              className={`p-4 rounded-xl border shadow-2xs ${
                                isDark
                                  ? "bg-zinc-950/80 border-zinc-800/90 text-zinc-100"
                                  : "bg-white border-slate-200/90 text-slate-900"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className={`text-sm sm:text-base font-bold flex items-center gap-1.5 flex-wrap ${isDark ? "text-white" : "text-slate-900"}`}>
                                  <span className="text-indigo-500 font-extrabold">§ {sec.num}.</span>
                                  <span>{highlightTextContent(sec.title)}</span>
                                </h3>

                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPage(pageNum);
                                      setActiveTab("raw_pdf");
                                    }}
                                    className={`p-1 rounded transition cursor-pointer ${
                                      isDark
                                        ? "text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800"
                                        : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                                    }`}
                                    title="View this topic in official PDF"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                  </button>
                                  <a
                                    href={`${pdfUrl}#page=${pageNum}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`p-1 rounded transition ${
                                      isDark
                                        ? "text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800"
                                        : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100"
                                    }`}
                                    title="Open this topic's page in new browser tab"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </div>
                              </div>

                              {sec.intro && (
                                <p className={`text-xs sm:text-sm italic p-2.5 rounded-lg border mb-3 ${
                                  isDark
                                    ? "bg-zinc-900/90 text-zinc-300 border-zinc-800"
                                    : "bg-slate-50/80 text-slate-600 border-slate-200/60"
                                }`}>
                                  {highlightTextContent(sec.intro)}
                                </p>
                              )}

                              <ul className="space-y-2">
                                {sec.bullets.map((b, idx) => {
                                  const bulletId = `section-${sec.num}-bullet-${idx}`;
                                  const hasColon = b.includes(":");
                                  if (hasColon) {
                                    const [label, val] = b.split(":", 1);
                                    const rest = b.substring(label.length + 1);
                                    return (
                                      <li
                                        key={idx}
                                        id={bulletId}
                                        className={`text-xs sm:text-sm leading-relaxed flex items-start gap-2 rounded-lg p-1 ${
                                          isDark ? "text-zinc-200" : "text-slate-700"
                                        }`}
                                      >
                                        <span className="text-indigo-500 font-bold mt-0.5 shrink-0">
                                          •
                                        </span>
                                        <div className="flex-1">
                                          <strong className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>
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
                                      id={bulletId}
                                      className={`text-xs sm:text-sm leading-relaxed flex items-start gap-2 rounded-lg p-1 ${
                                        isDark ? "text-zinc-200" : "text-slate-700"
                                      }`}
                                    >
                                      <span className="text-indigo-500 font-bold mt-0.5 shrink-0">
                                        •
                                      </span>
                                      <div className="flex-1">{highlightTextContent(b.trim())}</div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Format B: Uploaded document page rendered in structured format */
                      <div className="space-y-4">
                        {pageData.title && pageData.title !== `Page ${pageNum}` && (
                          <div className={`font-bold text-sm sm:text-base border-b pb-2 mb-2 flex items-center gap-2 ${
                            isDark ? "text-white border-zinc-800" : "text-slate-900 border-slate-100"
                          }`}>
                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                            <span>{highlightTextContent(pageData.title)}</span>
                          </div>
                        )}
                        <div className="space-y-2.5">
                          {(() => {
                            const pageText =
                              pageData.content ||
                              (pageData.chunks ? pageData.chunks.map((c) => c.content).join("\n\n") : "");

                            if (!pageText.trim()) {
                              return (
                                <p className={`text-xs sm:text-sm italic ${isDark ? "text-zinc-500" : "text-slate-500"}`}>
                                  No textual content available on this page.
                                </p>
                              );
                            }

                            const isMarkdownDoc =
                              docFileType === "md" ||
                              docFileType === "markdown" ||
                              documentName.toLowerCase().endsWith(".md") ||
                              documentName.toLowerCase().endsWith(".markdown") ||
                              pageText.includes("# ") ||
                              pageText.includes("```");

                            const renderHighlighted = (content) => {
                              if (!searchQuery.trim()) return content;
                              if (typeof content === "string") {
                                return highlightTextContent(content);
                              }
                              if (Array.isArray(content)) {
                                return content.map((c, i) =>
                                  typeof c === "string" ? <span key={i}>{highlightTextContent(c)}</span> : c
                                );
                              }
                              return content;
                            };

                            if (isMarkdownDoc) {
                              return (
                                <div className={`leading-relaxed space-y-3 ${isDark ? "text-zinc-200" : "text-slate-800"}`}>
                                  <ReactMarkdown
                                    components={{
                                      h1: ({ children }) => {
                                        const text = String(children);
                                        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                                        return (
                                          <h2 id={`heading-${slug}`} className={`text-base sm:text-lg font-bold border-b pb-2 mt-4 mb-3 flex items-center gap-2 ${
                                            isDark ? "text-white border-zinc-800" : "text-slate-900 border-slate-200"
                                          }`}>
                                            <span className="w-1.5 h-4 bg-indigo-600 rounded-full inline-block shrink-0" />
                                            <span>{renderHighlighted(children)}</span>
                                          </h2>
                                        );
                                      },
                                      h2: ({ children }) => {
                                        const text = String(children);
                                        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                                        return (
                                          <h3 id={`heading-${slug}`} className={`text-sm sm:text-base font-bold border-b pb-1.5 mt-4 mb-2 flex items-center gap-2 ${
                                            isDark ? "text-white border-zinc-800" : "text-slate-900 border-slate-100"
                                          }`}>
                                            <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full inline-block shrink-0" />
                                            <span>{renderHighlighted(children)}</span>
                                          </h3>
                                        );
                                      },
                                      h3: ({ children }) => {
                                        const text = String(children);
                                        const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                                        return (
                                          <h4 id={`heading-${slug}`} className={`text-xs sm:text-sm font-semibold mt-3 mb-1.5 flex items-center gap-1.5 ${
                                            isDark ? "text-zinc-200" : "text-slate-800"
                                          }`}>
                                            <span className="w-1 h-2.5 bg-indigo-400 rounded-full inline-block shrink-0" />
                                            <span>{renderHighlighted(children)}</span>
                                          </h4>
                                        );
                                      },
                                      code: ({ inline, children }) => {
                                        if (inline) {
                                          return (
                                            <code className={`px-1.5 py-0.5 rounded font-mono text-xs border ${
                                              isDark
                                                ? "bg-zinc-950 text-indigo-300 border-zinc-800"
                                                : "bg-slate-100 text-indigo-700 border-slate-200"
                                            }`}>
                                              {children}
                                            </code>
                                          );
                                        }
                                        return (
                                          <div className={`my-3 rounded-lg overflow-hidden border shadow-xs ${
                                            isDark ? "border-zinc-800 bg-zinc-950" : "border-slate-700 bg-slate-900"
                                          }`}>
                                            <div className={`px-3 py-1 border-b text-[11px] font-mono flex items-center justify-between ${
                                              isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-slate-800 border-slate-700 text-slate-400"
                                            }`}>
                                              <span>Code / Structured Content</span>
                                            </div>
                                            <pre className="p-3.5 text-xs text-slate-100 font-mono overflow-x-auto leading-relaxed">
                                              <code>{children}</code>
                                            </pre>
                                          </div>
                                        );
                                      },
                                      table: ({ children }) => (
                                        <div className={`overflow-x-auto my-3 rounded-lg border shadow-2xs ${
                                          isDark ? "border-zinc-800 bg-zinc-900" : "border-slate-200 bg-white"
                                        }`}>
                                          <table className={`w-full text-xs text-left border-collapse ${
                                            isDark ? "text-zinc-200" : "text-slate-700"
                                          }`}>{children}</table>
                                        </div>
                                      ),
                                      thead: ({ children }) => (
                                        <thead className={`font-semibold border-b ${
                                          isDark ? "bg-zinc-850 text-white border-zinc-700" : "bg-slate-100 text-slate-900 border-slate-200"
                                        }`}>{children}</thead>
                                      ),
                                      th: ({ children }) => (
                                        <th className={`px-3 py-2 border-r last:border-r-0 font-semibold ${
                                          isDark ? "border-zinc-700" : "border-slate-200"
                                        }`}>{children}</th>
                                      ),
                                      td: ({ children }) => (
                                        <td className={`px-3 py-2 border-b border-r last:border-r-0 ${
                                          isDark ? "border-zinc-800 bg-zinc-900 text-zinc-200" : "border-slate-200 bg-white text-slate-700"
                                        }`}>{children}</td>
                                      ),
                                      ul: ({ children }) => <ul className={`space-y-1.5 my-2 pl-4 list-disc marker:text-indigo-500 text-xs sm:text-sm ${
                                        isDark ? "text-zinc-200" : "text-slate-700"
                                      }`}>{children}</ul>,
                                      ol: ({ children }) => <ol className={`space-y-1.5 my-2 pl-4 list-decimal marker:text-indigo-600 font-medium text-xs sm:text-sm ${
                                        isDark ? "text-zinc-200" : "text-slate-700"
                                      }`}>{children}</ol>,
                                      li: ({ children }) => <li className="leading-relaxed">{renderHighlighted(children)}</li>,
                                      p: ({ children }) => <p className={`text-xs sm:text-sm leading-relaxed my-2 ${
                                        isDark ? "text-zinc-200" : "text-slate-800"
                                      }`}>{renderHighlighted(children)}</p>,
                                      blockquote: ({ children }) => (
                                        <blockquote className={`border-l-4 border-indigo-400 pl-3.5 py-1.5 my-2 text-xs sm:text-sm italic rounded-r ${
                                          isDark ? "bg-indigo-950/40 text-zinc-200" : "bg-indigo-50/40 text-slate-700"
                                        }`}>
                                          {children}
                                        </blockquote>
                                      ),
                                      hr: () => <hr className={`my-4 ${isDark ? "border-zinc-800" : "border-slate-200"}`} />,
                                    }}
                                  >
                                    {pageText}
                                  </ReactMarkdown>
                                </div>
                              );
                            }

                            const blocks = parseDocumentBlocks(pageText);

                            return blocks.map((block, bIdx) => {
                              const blockId = `block-${pageNum}-${bIdx}`;
                              if (block.type === "heading") {
                                return (
                                  <h4
                                    key={bIdx}
                                    id={blockId}
                                    className={`font-bold text-xs sm:text-sm pt-2.5 pb-1.5 border-b flex items-center gap-2 my-2 ${
                                      isDark ? "text-white border-zinc-800" : "text-slate-900 border-slate-100"
                                    }`}
                                  >
                                    <span className="w-1.5 h-3.5 bg-indigo-600 rounded-full inline-block shrink-0" />
                                    <span>{highlightTextContent(block.text)}</span>
                                  </h4>
                                );
                              }

                              if (block.type === "bullet") {
                                return (
                                  <div
                                    key={bIdx}
                                    id={blockId}
                                    className={`flex items-start gap-2 text-xs sm:text-sm leading-relaxed p-1 ${
                                      isDark ? "text-zinc-200" : "text-slate-700"
                                    }`}
                                  >
                                    <span className="text-indigo-600 font-bold shrink-0 mt-0.5 select-none">•</span>
                                    <div className="flex-1 leading-relaxed">
                                      {highlightTextContent(block.text)}
                                    </div>
                                  </div>
                                );
                              }

                              if (block.type === "image_ocr") {
                                return (
                                  <div
                                    key={bIdx}
                                    id={blockId}
                                    className={`my-3 p-3.5 rounded-xl border shadow-2xs ${
                                      isDark
                                        ? "bg-zinc-950/90 border-indigo-900/50 text-zinc-200"
                                        : "bg-indigo-50/40 border-indigo-100 text-slate-800"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-indigo-200/40">
                                      <div className={`p-1 rounded-md ${isDark ? "bg-indigo-950 text-indigo-400" : "bg-indigo-100 text-indigo-700"}`}>
                                        <ImageIcon className="w-3.5 h-3.5" />
                                      </div>
                                      <span className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-indigo-300" : "text-indigo-800"}`}>
                                        Extracted from Embedded Image / Diagram (OCR)
                                      </span>
                                    </div>
                                    <div className="text-xs sm:text-sm font-mono whitespace-pre-wrap leading-relaxed opacity-95">
                                      {highlightTextContent(block.text)}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <p
                                  key={bIdx}
                                  id={blockId}
                                  className={`text-xs sm:text-sm leading-relaxed text-justify my-1 ${
                                    isDark ? "text-zinc-200" : "text-slate-800"
                                  }`}
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
        <div className={`px-4 sm:px-6 py-2.5 border-t flex items-center justify-between text-xs ${
          isDark ? "bg-zinc-900 border-zinc-800 text-zinc-400" : "bg-slate-50 border-slate-200 text-slate-500"
        }`}>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Document: {documentName}</span>
          </div>
          <span className={`hidden sm:inline ${isDark ? "text-zinc-500" : "text-slate-400"}`}>
            Click any section or page pill above to navigate instantly
          </span>
        </div>
      </div>
    </div>
  );
}
