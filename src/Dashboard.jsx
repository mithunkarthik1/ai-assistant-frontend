import { useState, useEffect } from "react";
import ChatBot from "./components/chatbot/ChatBot";
import {
  Cpu,
  Sparkles,
  MessageCircle,
  FileText,
  Upload,
  ExternalLink,
  Sun,
  Moon,
  ChevronDown,
  User,
  LogOut,
  ShieldCheck,
  Bot,
  Database,
  Scan,
  FolderKanban,
  Zap,
} from "lucide-react";
import { getPolicyPdfUrl } from "./services/chatService";

export default function Dashboard({
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
}) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isDark = theme === "dark";
  const pdfUrl = getPolicyPdfUrl();

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent("open-policy-chat"));
  };

  const handleOpenHandbook = () => {
    window.dispatchEvent(
      new CustomEvent("open-policy-handbook", { detail: { page: 1 } })
    );
  };

  const handleOpenUpload = () => {
    window.dispatchEvent(new CustomEvent("open-document-upload"));
  };

  return (
    <div
      className={`min-h-screen flex flex-col font-sans relative overflow-hidden select-none transition-colors duration-300 ${
        isDark
          ? "bg-zinc-950 text-zinc-100"
          : "bg-gradient-to-b from-slate-50 via-slate-100/50 to-slate-200/60 text-slate-900"
      }`}
    >
      {/* Top Enterprise Header Bar (Handbook & Upload Docs removed) */}
      <header
        className={`w-full sticky top-0 z-30 px-4 sm:px-8 py-3 transition-colors duration-300 backdrop-blur-md border-b ${
          isDark
            ? "bg-zinc-900/90 border-zinc-800/80 text-white"
            : "bg-white/80 border-slate-200/80 text-slate-900"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand & Platform Status */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-bold tracking-tight text-sm sm:text-base transition-colors duration-300 ${
                    isDark ? "text-white" : "text-slate-900"
                  }`}
                >
                  AI Assistant
                </span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border transition-colors duration-300 ${
                    isDark
                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                      : "bg-indigo-50 text-indigo-700 border-indigo-200"
                  }`}
                >
                  Enterprise
                </span>
              </div>
              <div
                className={`hidden sm:flex items-center gap-1.5 text-[11px] transition-colors duration-300 ${
                  isDark ? "text-zinc-400" : "text-slate-500"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Enterprise AI Platform • Multi-Agent & RAG Core</span>
              </div>
            </div>
          </div>

          {/* Right Header Navigation: Theme Toggle & Authenticated Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Theme Toggle Button */}
            <button
              type="button"
              id="home-theme-toggle-btn"
              onClick={onToggleTheme}
              aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
              title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
              className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-300 cursor-pointer backdrop-blur-md shadow-2xs select-none ${
                isDark
                  ? "bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 hover:border-zinc-600 shadow-zinc-950/40"
                  : "bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-indigo-600 border border-slate-200 shadow-slate-200/50"
              }`}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
                  <span className="hidden sm:inline font-medium text-zinc-300">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
                  <span className="hidden sm:inline font-medium text-slate-700">Dark</span>
                </>
              )}
            </button>

            {/* Authenticated User Menu */}
            <div className="relative">
              <button
                type="button"
                id="user-profile-menu-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center gap-2 pl-2 pr-3 py-1 rounded-xl transition-all duration-200 cursor-pointer border ${
                  isDark
                    ? "bg-zinc-800/90 hover:bg-zinc-800 border-zinc-700 text-zinc-100"
                    : "bg-slate-100 hover:bg-slate-200/70 border-slate-200 text-slate-800"
                }`}
              >
                {currentUser?.avatar ? (
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-slate-300 dark:border-zinc-700"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="text-left hidden sm:block">
                  <p
                    className={`text-xs font-semibold leading-tight ${
                      isDark ? "text-zinc-100" : "text-slate-800"
                    }`}
                  >
                    {currentUser?.name}
                  </p>
                  <p
                    className={`text-[10px] leading-tight ${
                      isDark ? "text-zinc-400" : "text-slate-500"
                    }`}
                  >
                    {currentUser?.role || "Member"}
                  </p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div
                  className={`absolute right-0 mt-2 w-56 rounded-2xl border shadow-xl py-2 z-50 animate-fadeIn transition-colors duration-200 ${
                    isDark
                      ? "bg-zinc-900 border-zinc-800 text-zinc-200 shadow-2xl"
                      : "bg-white border-slate-200 text-slate-800 shadow-xl"
                  }`}
                >
                  <div className={`px-4 py-2 border-b ${isDark ? "border-zinc-800" : "border-slate-100"}`}>
                    <p className={`text-xs font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                      {currentUser?.name}
                    </p>
                    <p className={`text-[11px] truncate ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                      {currentUser?.email}
                    </p>
                    <div
                      className={`mt-1.5 inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                        isDark
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                          : "bg-indigo-50 text-indigo-700 border-indigo-100"
                      }`}
                    >
                      {currentUser?.role || "Member"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className={`w-full text-left px-4 py-2 text-xs flex items-center gap-2 cursor-pointer transition ${
                      isDark
                        ? "text-zinc-300 hover:bg-zinc-800"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Switch Account</span>
                  </button>
                  <button
                    type="button"
                    onClick={onLogout}
                    className={`w-full text-left px-4 py-2 text-xs text-rose-500 flex items-center gap-2 cursor-pointer transition ${
                      isDark ? "hover:bg-rose-500/10" : "hover:bg-rose-50"
                    }`}
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero & Dashboard Area (Clean, balanced, professional) */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-16 relative z-10">
        <div className="text-center max-w-4xl w-full">
          {/* Top Status Pill */}
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-5 border transition-all duration-300 ${
              isDark
                ? "bg-zinc-900 text-zinc-300 border-zinc-800 shadow-xs"
                : "bg-white/90 text-slate-700 border-slate-200 shadow-2xs"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Enterprise AI Platform</span>
            <span className={`w-1 h-1 rounded-full ${isDark ? "bg-zinc-700" : "bg-slate-400"}`} />
            <span className={`font-normal ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
              Agents • RAG • OCR • Gen AI
            </span>
          </div>

          {/* Greeting */}
          <div className="mb-4">
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold mb-2 border transition-colors duration-300 ${
                isDark
                  ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
                  : "bg-indigo-50 border-indigo-200 text-indigo-700"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>
                Signed In as {currentUser?.role || "Enterprise Member"} • {currentUser?.department || "Workspace"}
              </span>
            </div>
            <h1
              className={`text-4xl sm:text-5xl font-extrabold tracking-tight transition-colors duration-300 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Welcome, {currentUser?.name || "Member"}
            </h1>
          </div>

          <p
            className={`mt-3 text-base sm:text-lg font-normal leading-relaxed max-w-2xl mx-auto transition-colors duration-300 ${
              isDark ? "text-zinc-300" : "text-slate-600"
            }`}
          >
            Unified enterprise AI platform powering intelligent agents, grounded knowledge retrieval, optical document vision, project workflows, and generative AI.
          </p>

          {/* Quick Action CTAs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              id="hero-open-chat-btn"
              onClick={handleOpenChat}
              className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 hover:scale-[1.02] shadow-md ${
                isDark
                  ? "bg-white hover:bg-zinc-100 text-zinc-950 shadow-md font-semibold"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20"
              }`}
            >
              <MessageCircle className={`w-4 h-4 ${isDark ? "text-zinc-950" : "text-indigo-300"}`} />
              <span>Launch AI Assistant</span>
            </button>

            <button
              type="button"
              id="hero-open-handbook-btn"
              onClick={handleOpenHandbook}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 hover:scale-[1.02] border ${
                isDark
                  ? "bg-zinc-900 text-zinc-200 hover:text-white hover:bg-zinc-800 border-zinc-800 shadow-xs"
                  : "bg-white text-slate-800 hover:text-indigo-700 hover:bg-indigo-50/60 border-slate-300/80 shadow-xs"
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Handbook Viewer</span>
            </button>

            <button
              type="button"
              id="hero-open-upload-btn"
              onClick={handleOpenUpload}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer flex items-center gap-2 hover:scale-[1.02] border ${
                isDark
                  ? "bg-zinc-900 text-zinc-200 hover:text-emerald-300 hover:bg-zinc-800 border-zinc-800 shadow-xs"
                  : "bg-white text-slate-800 hover:text-emerald-700 hover:bg-emerald-50/60 border-slate-300/80 shadow-xs"
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-500" />
              <span>Upload PDF / Docs</span>
            </button>

            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`px-3.5 py-2.5 rounded-xl font-medium text-xs transition cursor-pointer flex items-center gap-1.5 ${
                isDark
                  ? "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
              title="Open raw PDF file in new browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span>Raw PDF</span>
            </a>
          </div>

          {/* Enterprise Capabilities Grid (General Professional: Agents, RAG, OCR, Projects & Gen AI) */}
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-left">
            {/* Card 1: Generic Agents */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 shadow-xs"
                  : "bg-white border-slate-200/90 shadow-xs hover:border-slate-300"
              }`}
            >
              <Bot className="w-5 h-5 text-indigo-500 mb-2" />
              <h3 className={`text-xs font-bold ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
                Autonomous Agents
              </h3>
              <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                Goal-oriented multi-agent workflows, tool execution, and dynamic task automation.
              </p>
            </div>

            {/* Card 2: Grounded RAG & Policies */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 shadow-xs"
                  : "bg-white border-slate-200/90 shadow-xs hover:border-slate-300"
              }`}
            >
              <Database className="w-5 h-5 text-emerald-500 mb-2" />
              <h3 className={`text-xs font-bold ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
                Enterprise RAG
              </h3>
              <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                Hybrid dense and lexical vector retrieval grounded in official corporate knowledge.
              </p>
            </div>

            {/* Card 3: Optical OCR Engine */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 shadow-xs"
                  : "bg-white border-slate-200/90 shadow-xs hover:border-slate-300"
              }`}
            >
              <Scan className="w-5 h-5 text-amber-500 mb-2" />
              <h3 className={`text-xs font-bold ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
                OCR Document Vision
              </h3>
              <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                Optical transcription of embedded ER diagrams, screenshots, flowcharts, and tables.
              </p>
            </div>

            {/* Card 4: Projects & Generative AI */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                isDark
                  ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/60 shadow-xs"
                  : "bg-white border-slate-200/90 shadow-xs hover:border-slate-300"
              }`}
            >
              <Sparkles className="w-5 h-5 text-violet-500 mb-2" />
              <h3 className={`text-xs font-bold ${isDark ? "text-zinc-100" : "text-slate-900"}`}>
                Projects & Gen AI
              </h3>
              <p className={`text-[11px] mt-1 leading-relaxed ${isDark ? "text-zinc-400" : "text-slate-500"}`}>
                Project workspace integration, user-story intelligence, synthesis, and creative reasoning.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className={`w-full border-t py-4 text-center text-xs transition-colors duration-300 ${
          isDark
            ? "border-zinc-800/80 bg-zinc-950 text-zinc-400"
            : "border-slate-200 bg-white/50 text-slate-500"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 AI Assistant Platform. All rights reserved.</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className={isDark ? "text-zinc-400" : "text-slate-500"}>
              Authenticated Enterprise Workspace
            </span>
            <span>•</span>
            <span className={isDark ? "text-zinc-500" : "text-slate-400"}>
              Centralized JWT Security
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot Assistant Widget & Modals */}
      <ChatBot isDark={isDark} />
    </div>
  );
}
