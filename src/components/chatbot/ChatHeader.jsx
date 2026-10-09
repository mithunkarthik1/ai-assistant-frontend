import { Bot, Minus, Maximize2, Minimize2, ChevronUp, X, MessageSquare, BookOpen } from "lucide-react";

export default function ChatHeader({
  onClose,
  onMinimize,
  onToggleMaximize,
  onOpenHandbook,
  isMinimized,
  isMaximized,
  messageCount = 0,
  isDark = false,
}) {
  return (
    <div
      onClick={isMinimized ? onMinimize : undefined}
      role={isMinimized ? "button" : undefined}
      tabIndex={isMinimized ? 0 : undefined}
      onKeyDown={
        isMinimized
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onMinimize();
              }
            }
          : undefined
      }
      className={`flex items-center justify-between px-4 py-3 select-none shrink-0 transition-colors duration-300 ${
        isDark
          ? "bg-zinc-900 text-white border-b border-zinc-800"
          : "bg-white text-slate-900 border-b border-slate-200 shadow-2xs"
      } ${isMinimized ? (isDark ? "cursor-pointer hover:bg-zinc-800" : "cursor-pointer hover:bg-slate-50") : ""}`}
    >
      {/* Bot Identity */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-colors ${
            isDark
              ? "bg-zinc-800 text-indigo-400 border border-zinc-700/80"
              : "bg-slate-100 text-slate-800 border border-slate-200"
          }`}
        >
          <Bot className={`w-4 h-4 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2
              className={`text-sm font-semibold tracking-wide truncate ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              AI Assistant
            </h2>
            {isMinimized && messageCount > 0 && (
              <span
                className={`hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium border ${
                  isDark
                    ? "bg-indigo-950/60 text-indigo-300 border-indigo-800/60"
                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                }`}
              >
                <MessageSquare className="w-2.5 h-2.5" />
                <span>{messageCount}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span
              className={`text-[11px] font-medium truncate ${
                isDark ? "text-zinc-400" : "text-slate-500"
              }`}
            >
              {isMinimized ? "Click anywhere to restore" : "Online • Knowledge & Document Assistant"}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center gap-1 shrink-0 ml-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handbook / Policy PDF Button */}
        {!isMinimized && onOpenHandbook && (
          <button
            type="button"
            onClick={() => onOpenHandbook(1)}
            aria-label="Open Document Handbook PDF"
            title="Open Document Handbook (PDF)"
            className={`px-2.5 py-1 rounded-md transition cursor-pointer text-xs font-semibold flex items-center gap-1.5 mr-1 border shadow-xs ${
              isDark
                ? "text-zinc-200 hover:text-white hover:bg-zinc-800 border-zinc-750 bg-zinc-900"
                : "text-slate-700 hover:text-indigo-700 hover:bg-indigo-50/80 border-slate-200 bg-slate-50"
            }`}
          >
            <BookOpen className={`w-3.5 h-3.5 ${isDark ? "text-indigo-400" : "text-indigo-600"}`} />
            <span>Handbook PDF</span>
          </button>
        )}

        {/* Minimize / Restore from Minimized */}
        {isMinimized ? (
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Restore chat window"
            title="Restore chat"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark
                ? "text-zinc-300 hover:text-white hover:bg-zinc-800"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <ChevronUp className="w-4 h-4 text-emerald-500" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize chat window"
            title="Minimize"
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark
                ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Minus className="w-4 h-4" />
          </button>
        )}

        {/* Maximize / Restore Size */}
        {!isMinimized && onToggleMaximize && (
          <button
            type="button"
            onClick={onToggleMaximize}
            aria-label={isMaximized ? "Restore default window size" : "Maximize chat window"}
            title={isMaximized ? "Restore size (Esc)" : "Maximize screen"}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isDark
                ? "text-zinc-400 hover:text-white hover:bg-zinc-800"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            {isMaximized ? (
              <Minimize2 className={`w-4 h-4 ${isDark ? "text-indigo-300" : "text-indigo-600"}`} />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          title="Close"
          className={`p-1.5 rounded-lg transition cursor-pointer ${
            isDark
              ? "text-zinc-400 hover:text-rose-400 hover:bg-zinc-800"
              : "text-slate-500 hover:text-rose-600 hover:bg-rose-50"
          }`}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
