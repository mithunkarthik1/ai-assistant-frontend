import { useState } from "react";
import { Bot, User, Copy, Check, FileText, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getPolicyPdfUrl } from "../../services/chatService";

export default function ChatMessage({ message, onOpenHandbook }) {
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

  const firstSource = message.sources && message.sources.length > 0 ? message.sources[0] : null;

  // Show PDF buttons if information is NOT found in handbook, or if explicitly requested.
  // When a valid grounded answer is found from policy, show_pdf is false ("or else no needed").
  const shouldShowPdf =
    !isUser &&
    (message.show_pdf === true ||
      (message.show_pdf !== false &&
        (message.content?.includes("WorkPilot Company Policy Handbook (PDF)") ||
          message.content?.includes("Policy Handbook (PDF) directly below") ||
          message.content?.includes("couldn't find") ||
          message.content?.includes("could not find") ||
          message.content?.includes("wasn't able to find") ||
          message.content?.includes("not documented in") ||
          message.content?.includes("outside our documented") ||
          message.content?.includes("consult Workplace Operations") ||
          message.content?.includes("consult People Operations"))));

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

        {/* PDF action buttons: shown when info is NOT found in handbook, or if explicitly requested */}
        {shouldShowPdf && (
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenHandbook && onOpenHandbook(firstSource?.page || 1)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200/80 transition-all cursor-pointer shadow-2xs group/chip"
              title="Open interactive Policy Handbook"
            >
              <FileText className="w-3 h-3 text-indigo-600 group-hover/chip:scale-110 transition-transform" />
              <span>Open Policy Handbook (PDF)</span>
            </button>
            <a
              href={`${pdfUrl}#page=${firstSource?.page || 1}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
              title="Open official PDF in new browser tab"
            >
              <ExternalLink className="w-3 h-3 text-slate-400" />
              <span>Open PDF</span>
            </a>
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
