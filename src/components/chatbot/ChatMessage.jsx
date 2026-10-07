import { useState, useMemo } from "react";
import { Bot, User, Copy, Check, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getPolicyPdfUrl } from "../../services/chatService";

export default function ChatMessage({ message, previousMessage, onOpenHandbook, onPromptClick }) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const pdfUrl = getPolicyPdfUrl();

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(message.content);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = message.content;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  // Only show handbook chips when the answer is grounded in / answered from documents
  const hasDocumentSources = !isUser && Boolean(message.sources && message.sources.length > 0);

  // Group unique cited documents and pick their most specific topic
  const uniqueCitedDocs = useMemo(() => {
    if (!message.sources || message.sources.length === 0) return [];

    const map = new Map();
    const isGeneric = (t) => {
      if (!t) return true;
      const s = String(t).toLowerCase().trim().replace(/[:.]/g, "");
      const genericWords = [
        "general", "details", "overview", "introduction", "section",
        "handbook", "objective", "are", "is", "was", "were", "ex", "eg", "case",
        "example", "note", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "30-day", "day", "days", "clause", "document", "part", "such as", "as follows"
      ];
      if (genericWords.includes(s)) return true;
      if (/^\d+$/.test(s)) return true;
      if (s.length < 3) return true;
      return false;
    };

    const userWords = (previousMessage?.role === "user" ? previousMessage.content : "")
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !["what", "the", "and", "for", "with", "about", "how", "are", "can", "tell"].includes(w));

    // Rate how accurately a candidate topic matches the user question
    const rateTopicRelevance = (topicStr, sectionStr) => {
      const combined = `${topicStr || ""} ${sectionStr || ""}`.toLowerCase();
      if (!combined.trim() || isGeneric(topicStr)) return -10;
      let score = 0;
      for (const w of userWords) {
        if (combined.includes(w)) score += 20;
      }
      // If user did NOT explicitly ask for encashment, penalize "encashment" so leave policy/guidelines is favored
      if (!userWords.includes("encashment") && combined.includes("encashment")) {
        score -= 25;
      }
      // Reward exact phrases like "leave policy", "pto", "guidelines"
      if (combined.includes("leave policy") || combined.includes("guidelines for leave") || combined.includes("paid time off")) {
        score += 15;
      }
      return score;
    };

    for (const src of message.sources) {
      const docKey = src.document_id || src.filename;
      if (!docKey) continue;

      const isDefault =
        !src.document_id ||
        src.document_id === "00000000-0000-0000-0000-000000000002" ||
        src.filename === "WorkPilot_Company_Policy.pdf" ||
        src.filename?.toLowerCase().includes("workpilot");

      const rawTopic = (src.topic || "").trim();
      let rawSection = (src.section || "").trim();
      let bestTopic = "";
      if (!isGeneric(rawTopic)) {
        bestTopic = rawTopic;
      } else if (!isGeneric(rawSection)) {
        bestTopic = rawSection;
      } else {
        bestTopic = "";
      }

      // If topic is generic or missing, extract § or Section topic from assistant's text
      if (!bestTopic && message.content) {
        const secMatch = message.content.match(/(?:§\s*(\d+)|\bSection\s+(\d+))[:.\-\s]+([^,\n)]+)/i);
        if (secMatch) {
          const extractedTitle = (secMatch[3] || "").replace(/[*_#]/g, "").trim();
          if (!isGeneric(extractedTitle) && extractedTitle.length >= 3) {
            bestTopic = extractedTitle;
            rawSection = secMatch[1] || secMatch[2] || rawSection;
          }
        }
      }

      const displayName = isDefault ? "Company Policy" : (src.filename || "Document");
      const currentScore = rateTopicRelevance(bestTopic, rawSection);

      if (!map.has(docKey)) {
        map.set(docKey, {
          documentId: isDefault ? "00000000-0000-0000-0000-000000000002" : src.document_id,
          filename: displayName,
          rawFilename: src.filename || (isDefault ? "WorkPilot_Company_Policy.pdf" : "Document.pdf"),
          isDefault,
          page: src.page || 1,
          topic: bestTopic,
          section: rawSection,
          relevanceScore: currentScore,
        });
      } else {
        const existing = map.get(docKey);
        // Replace with higher relevance topic for the user question
        if (currentScore > (existing.relevanceScore ?? -99)) {
          existing.topic = bestTopic;
          existing.section = rawSection || existing.section;
          existing.page = src.page || existing.page;
          existing.relevanceScore = currentScore;
        } else if (isGeneric(existing.topic) && !isGeneric(bestTopic)) {
          existing.topic = bestTopic;
          existing.section = rawSection || existing.section;
          existing.page = src.page || existing.page;
          existing.relevanceScore = currentScore;
        }
      }
    }

    return Array.from(map.values());
  }, [message.sources, message.content, previousMessage]);

  // Determine if the user inquiry specifically targeted a particular PDF/document.
  // When a user asks about one specific PDF ("in ms leave policy", "what bubble sort?"),
  // show ONLY that handbook ("just show that handbook no two").
  const displayDocs = useMemo(() => {
    if (!uniqueCitedDocs || uniqueCitedDocs.length === 0) return [];

    const userPrompt = (
      previousMessage?.role === "user" ? previousMessage.content : ""
    ).toLowerCase().trim();

    const assistantText = (message.content || "").toLowerCase();

    // Greetings should NEVER render document citations
    const isUserGreeting = [
      "hi", "hello", "hey", "hola", "namaste", "good morning", "good evening",
      "good afternoon", "howdy", "sup", "what's up", "whats up", "thanks", "thank you"
    ].includes(userPrompt.replace(/[^\w\s]/g, "").trim());
    const isAssistantGreeting =
      assistantText.startsWith("hello") ||
      assistantText.startsWith("hi ") ||
      assistantText.startsWith("hey ") ||
      assistantText.includes("how can i assist you today") ||
      assistantText.includes("how can i help you today");
    if (isUserGreeting || (isAssistantGreeting && userPrompt.length <= 15)) {
      return [];
    }

    const isNegativeAnswer = [
      "not specified in the retrieved knowledge base",
      "not documented in the current knowledge base",
      "not found in the available knowledge base",
      "not mentioned in the retrieved context",
      "couldn't find information regarding",
      "not specified in the available documents",
    ].some((phrase) => assistantText.includes(phrase));

    const isDocTargeted = (doc) => {
      if (!userPrompt) return false;

      if (doc.isDefault) {
        const defaultKeywords = [
          "company policy",
          "workpilot policy",
          "workpilot",
          "work pilot",
          "company handbook",
          "default policy",
          "employee handbook",
          "workpilot_company_policy",
        ];
        return defaultKeywords.some((kw) => userPrompt.includes(kw));
      }

      const raw = (doc.rawFilename || doc.filename || "").toLowerCase();
      const baseName = raw.replace(/\.[^/.]+$/, "");
      const cleanName = baseName.replace(/^[\d.\-_ ]+/, "").trim();
      const spaceName = cleanName.replace(/[()[\]{}\-_.,:;]+/g, " ").trim();

      if (
        userPrompt.includes(raw) ||
        userPrompt.includes(baseName) ||
        (cleanName.length >= 3 && userPrompt.includes(cleanName)) ||
        (spaceName.length >= 3 && userPrompt.includes(spaceName))
      ) {
        return true;
      }

      const words = spaceName.split(/\s+/).filter((w) => w.length > 1);
      // Check bigrams (e.g. "bubble sort")
      for (let i = 0; i < words.length - 1; i++) {
        const bigram = `${words[i]} ${words[i + 1]}`;
        if (bigram.length >= 4 && userPrompt.includes(bigram)) {
          return true;
        }
      }

      // Check first distinctive word combined with doc/pdf/file/policy/handbook
      if (words.length > 0 && !["company", "policy", "the", "doc", "file"].includes(words[0])) {
        const firstWord = words[0];
        if (
          userPrompt.includes(firstWord) &&
          (userPrompt.includes("policy") ||
            userPrompt.includes("leave") ||
            userPrompt.includes("doc") ||
            userPrompt.includes("pdf") ||
            userPrompt.includes("file") ||
            userPrompt.includes("handbook"))
        ) {
          return true;
        }
      }

      return false;
    };

    const targetedDocs = uniqueCitedDocs.filter(isDocTargeted);

    // If query specifically targeted document(s), show ONLY those targeted documents
    if (targetedDocs.length > 0) {
      return targetedDocs;
    }

    // Check if the assistant answer itself explicitly attributes a specific document
    const docMentions = uniqueCitedDocs.filter((doc) => {
      const raw = (doc.rawFilename || doc.filename || "").toLowerCase();
      const base = raw.replace(/\.[^/.]+$/, "");
      const clean = base.replace(/^[\d.\-_ ]+/, "").trim();
      const space = clean.replace(/[()[\]{}\-_.,:;]+/g, " ").trim();
      return (
        assistantText.includes(raw) ||
        assistantText.includes(base) ||
        (clean.length >= 3 && assistantText.includes(clean)) ||
        (space.length >= 3 && assistantText.includes(space))
      );
    });

    // If the assistant answer explicitly cites specific document(s), show ONLY those cited documents
    if (docMentions.length > 0) {
      return docMentions;
    }

    // If the answer is negative ("not specified", "not documented") and no document was targeted or mentioned,
    // do NOT display spurious unrelated citations (e.g. ms-leave-policy when asking about bubble sort)
    if (isNegativeAnswer) {
      return [];
    }

    return uniqueCitedDocs;
  }, [uniqueCitedDocs, previousMessage, message.content]);

  // Detect if this assistant message is asking the user to specify/clarify which document
  const isDocumentClarification = useMemo(() => {
    if (isUser || !message.content) return false;
    const lower = message.content.toLowerCase();
    return (
      lower.includes("specify which document") ||
      lower.includes("multiple documents in the knowledge base") ||
      lower.includes("which document would you like to consult")
    );
  }, [isUser, message.content]);

  // Candidate documents for interactive clarification buttons
  const clarificationDocs = useMemo(() => {
    if (!isDocumentClarification) return [];
    if (displayDocs && displayDocs.length > 0) return displayDocs;

    // Extract document names from bullet points in message.content
    const docs = [];
    const bulletRegex = /(?:•|\*|-)\s*\*\*?([^*]+?\.(?:pdf|docx|txt|md)|[^*]+?)\*\*?/gi;
    let match;
    while ((match = bulletRegex.exec(message.content)) !== null) {
      const name = match[1].trim();
      if (name && name.length >= 3 && !docs.some(d => d.rawFilename === name)) {
        docs.push({
          documentId: null,
          filename: name,
          rawFilename: name,
          isDefault: name.toLowerCase().includes("workpilot"),
          page: 1,
          topic: "",
          section: "",
        });
      }
    }
    return docs;
  }, [isDocumentClarification, displayDocs, message.content]);

  return (
    <div
      className={`group flex items-start gap-2.5 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs ${
          isUser
            ? "bg-slate-900 text-white"
            : "bg-slate-200 text-slate-700"
        }`}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Message & Actions Container */}
      <div className={`flex flex-col gap-0.5 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Message Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed select-text shadow-xs ${
            isUser
              ? "bg-slate-900 text-white rounded-tr-sm"
              : "bg-white border border-slate-200/80 text-slate-800 rounded-tl-sm"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap select-text selection:bg-indigo-100 selection:text-indigo-900">
              {message.content}
            </p>
          ) : (
            <div className="select-text selection:bg-indigo-100 selection:text-indigo-900">
              <ReactMarkdown
                components={{
                  a: ({ href, children }) => {
                    const isPdfLink = href && (href.includes("pdf") || href.includes("policy") || href.includes("handbook"));
                    const targetUrl = isPdfLink ? pdfUrl : href;
                    return (
                      <a
                        href={targetUrl}
                        onClick={(e) => {
                          if (isPdfLink) {
                            e.preventDefault();
                            if (onOpenHandbook) onOpenHandbook(1);
                            else window.open(pdfUrl, "_blank");
                          }
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-indigo-600 hover:text-indigo-800 underline underline-offset-2 inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>{children}</span>
                        <ExternalLink className="w-3 h-3 inline text-indigo-500" />
                      </a>
                    );
                  },
                  h3: ({ children }) => (
                    <h3 className="font-semibold text-slate-900 text-sm mb-1.5 pb-1 border-b border-slate-100">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="leading-relaxed mb-2 last:mb-0 text-slate-800">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-outside ml-4 mb-2 space-y-1 text-slate-700">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-outside ml-4 mb-2 space-y-1 text-slate-700">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-slate-900">
                      {children}
                    </strong>
                  ),
                  code: ({ children }) => (
                    <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-xs text-indigo-600 font-medium">
                      {children}
                    </code>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>


        {/* Document Disambiguation / Clarification Action Buttons */}
        {isDocumentClarification && clarificationDocs.length > 0 && (
          <div className="mt-2 flex flex-col gap-1.5 w-full max-w-md">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>👉</span>
              <span>Click document to get specific answer:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {clarificationDocs.map((doc, idx) => {
                const isViolet = !doc.isDefault;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const prevQ = previousMessage?.role === "user" ? previousMessage.content : "";
                      const promptText = prevQ ? `In ${doc.rawFilename}: ${prevQ}` : doc.rawFilename;
                      if (onPromptClick) {
                        onPromptClick(promptText);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs hover:shadow-xs group/btn ${
                      isViolet
                        ? "bg-violet-50 hover:bg-violet-100 text-violet-800 border-violet-200"
                        : "bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200"
                    }`}
                  >
                    <FileText className={`w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform ${isViolet ? "text-violet-600" : "text-indigo-600"}`} />
                    <span>{doc.rawFilename}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Document Handbook Action Chips: shows compact chips for cited PDF(s) */}
        {!isDocumentClarification && hasDocumentSources && displayDocs.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 max-w-full">
            {displayDocs.map((doc, idx) => {
              const isViolet = !doc.isDefault;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    onOpenHandbook &&
                    onOpenHandbook(doc.page, {
                      documentId: doc.documentId,
                      documentName: doc.rawFilename,
                      isDefault: doc.isDefault,
                      targetSection: doc.section,
                      targetTopic: doc.topic,
                      highlightText: doc.topic || doc.section || "",
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-all cursor-pointer shadow-2xs hover:shadow-xs group/chip max-w-full ${
                    isViolet
                      ? "bg-violet-50/90 hover:bg-violet-100 text-violet-900 border-violet-200/90"
                      : "bg-indigo-50/90 hover:bg-indigo-100 text-indigo-900 border-indigo-200/90"
                  }`}
                  title={`Open ${doc.filename} handbook at Page ${doc.page}${doc.topic ? ` (${doc.topic})` : ""}`}
                >
                  <FileText
                    className={`w-3 h-3 shrink-0 group-hover/chip:scale-110 transition-transform ${
                      isViolet ? "text-violet-600" : "text-indigo-600"
                    }`}
                  />
                  <span className="font-semibold text-slate-800 shrink-0 truncate max-w-[120px] sm:max-w-[150px]">
                    {doc.filename}
                  </span>
                  {doc.topic && (
                    <>
                      <span className="text-slate-300 select-none">•</span>
                      <span
                        className={`font-semibold px-1 py-0.5 rounded text-[10px] shrink-0 truncate max-w-[110px] sm:max-w-[140px] ${
                          isViolet
                            ? "bg-violet-100/90 text-violet-700"
                            : "bg-indigo-100/90 text-indigo-700"
                        }`}
                      >
                        {doc.topic}
                      </span>
                    </>
                  )}
                  <span className="text-slate-300 select-none">•</span>
                  <span
                    className={`text-[10px] font-bold shrink-0 ${
                      isViolet ? "text-violet-600" : "text-indigo-600"
                    }`}
                  >
                    Pg {doc.page}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Separate Action Row (placed cleanly outside and below the bubble) */}
        <div
          className={`flex items-center gap-1 px-1 py-0.5 ${
            isUser ? "justify-end" : "justify-start"
          }`}
        >
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy message"}
            aria-label={copied ? "Copied" : "Copy message to clipboard"}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer inline-flex items-center justify-center opacity-60 hover:opacity-100 group-hover:opacity-100"
          >
            {copied ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium animate-in zoom-in-75 duration-150">
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </span>
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
