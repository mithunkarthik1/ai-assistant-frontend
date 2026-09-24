import { ShieldCheck, Minus, Maximize2, Minimize2, ChevronUp, X, MessageSquare, BookOpen } from "lucide-react";

export default function ChatHeader({
  onClose,
  onMinimize,
  onToggleMaximize,
  onOpenHandbook,
  isMinimized,
  isMaximized,
  messageCount = 0,
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
      className={`flex items-center justify-between px-4 py-3 bg-slate-900 text-white select-none border-b border-slate-800 shrink-0 transition-colors ${
        isMinimized ? "cursor-pointer hover:bg-slate-800/90" : ""
      }`}
    >
      {/* Bot Identity */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 border border-slate-700/60 shrink-0 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide text-white truncate">
              WorkPilot Assistant
            </h2>
            {isMinimized && messageCount > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-indigo-900/80 text-indigo-300 border border-indigo-700/50">
                <MessageSquare className="w-2.5 h-2.5" />
                <span>{messageCount}</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 text-[11px] font-medium truncate">
              {isMinimized ? "Click anywhere to restore" : "Policy + Project Assistant"}
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
            aria-label="Open Policy Handbook PDF"
            title="Open Official Policy Handbook (PDF)"
            className="px-2.5 py-1 rounded-md text-slate-200 hover:text-white hover:bg-slate-800 transition cursor-pointer text-xs font-semibold flex items-center gap-1.5 mr-1 border border-slate-700 hover:border-slate-500 bg-slate-800/80 shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Policy PDF</span>
          </button>
        )}

        {/* Minimize / Restore from Minimized */}
        {isMinimized ? (
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Restore chat window"
            title="Restore chat"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <ChevronUp className="w-4 h-4 text-emerald-400" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize chat window"
            title="Minimize"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
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
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4 text-indigo-300" />
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
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
