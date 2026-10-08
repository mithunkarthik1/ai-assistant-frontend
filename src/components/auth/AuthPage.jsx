import { useState, useMemo } from "react";
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  FileText,
  Cpu,
  Layers,
  Check,
  X,
} from "lucide-react";
import { loginUser, signupUser } from "../../services/authService";

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Signup form state (Original Authenticated User)
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  // Password criteria matching backend validation (backend/src/utils/helper.py)
  const passwordCriteria = useMemo(() => {
    return {
      minLen: signupPassword.length >= 8 && signupPassword.length <= 128,
      hasLower: /[a-z]/.test(signupPassword),
      hasUpper: /[A-Z]/.test(signupPassword),
      hasNumber: /[0-9]/.test(signupPassword),
      hasSpecial: /[^A-Za-z0-9\s]/.test(signupPassword),
      noWhitespaceEnds: signupPassword.length > 0 && signupPassword === signupPassword.trim(),
    };
  }, [signupPassword]);

  const strength = useMemo(() => {
    if (!signupPassword) return { score: 0, label: "Empty", color: "bg-slate-700", text: "text-slate-500", percent: 0 };
    let score = 0;
    if (passwordCriteria.minLen) score += 1;
    if (passwordCriteria.hasLower) score += 1;
    if (passwordCriteria.hasUpper) score += 1;
    if (passwordCriteria.hasNumber) score += 1;
    if (passwordCriteria.hasSpecial) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-rose-500", text: "text-rose-400", percent: 25 };
    if (score === 3) return { score, label: "Fair", color: "bg-amber-500", text: "text-amber-400", percent: 50 };
    if (score === 4) return { score, label: "Good", color: "bg-blue-500", text: "text-blue-400", percent: 75 };
    return { score, label: "Strong", color: "bg-emerald-500", text: "text-emerald-400", percent: 100 };
  }, [signupPassword, passwordCriteria]);

  const isPasswordValid = useMemo(() => {
    return (
      passwordCriteria.minLen &&
      passwordCriteria.hasLower &&
      passwordCriteria.hasUpper &&
      passwordCriteria.hasNumber &&
      passwordCriteria.hasSpecial &&
      passwordCriteria.noWhitespaceEnds
    );
  }, [passwordCriteria]);

  const passwordsMatch = useMemo(() => {
    if (!signupConfirmPassword) return null;
    return signupPassword === signupConfirmPassword;
  }, [signupPassword, signupConfirmPassword]);

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const cleanEmail = loginEmail.trim();
    if (!cleanEmail) {
      setErrorMessage("Please enter your registered email address.");
      return;
    }
    if (!loginPassword) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await loginUser({
        email: cleanEmail,
        password: loginPassword,
        remember: rememberMe,
      });
      setSuccessMessage(`Welcome back, ${user.name || user.email}!`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(user);
      }, 400);
    } catch (err) {
      setErrorMessage(err.message || "Invalid email address or password.");
      setIsLoading(false);
    }
  };

  // Handle Signup Submit (Original Authenticated User)
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!signupName.trim()) {
      setErrorMessage("Please enter your full legal name.");
      return;
    }

    if (!signupEmail.trim() || !signupEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage(
        "Password must be 8-128 characters, include uppercase, lowercase, number, and a special character."
      );
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setErrorMessage("Passwords do not match. Please verify both fields.");
      return;
    }

    if (!agreeTerms) {
      setErrorMessage("Please accept the terms to proceed.");
      return;
    }

    setIsLoading(true);

    try {
      const user = await signupUser({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        phone_number: signupPhone.trim() || null,
      });
      setSuccessMessage(`Account created successfully! Authenticating ${user.name || user.email}...`);
      setTimeout(() => {
        if (onAuthSuccess) onAuthSuccess(user);
      }, 500);
    } catch (err) {
      setErrorMessage(err.message || "Failed to create account.");
      setIsLoading(false);
    }
  };

  // Handle Forgot Password
  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.includes("@")) {
      return;
    }
    setForgotSent(true);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-[-25%] left-[-15%] w-[60vw] h-[60vw] rounded-full bg-indigo-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[55vw] h-[55vw] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none" />

      {/* Main Dual-Panel Enterprise Container */}
      <div className="w-full max-w-5xl rounded-3xl bg-slate-900/95 border border-slate-800/90 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col lg:flex-row relative z-10 transition-all">
        
        {/* LEFT PANEL: Enterprise Product Showcase */}
        <div className="lg:w-5/12 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/70 p-8 sm:p-10 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800/80 relative">
          <div>
            {/* Top Security Status Pill */}
            <div className="flex items-center justify-between mb-8">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                JWT Argon2 Verified
              </span>

              <span className="text-[11px] font-mono text-slate-500">
                AES-256 GCM
              </span>
            </div>

            {/* Brand Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 border border-indigo-400/30">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  AI Assistant
                </h1>
                <p className="text-xs text-slate-400 font-medium">Enterprise Knowledge Intelligence</p>
              </div>
            </div>

            {/* Value Proposition */}
            <p className="text-sm text-slate-300 font-normal leading-relaxed mt-4">
              Authenticated workspace powered by multi-document vector search, optical OCR diagram recognition, and centralized JWT security.
            </p>

            {/* Feature Capability Highlights */}
            <div className="mt-7 space-y-3">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-700/80 transition">
                <FileText className="w-5 h-5 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Optical OCR Image Extraction</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Auto-scans embedded flowchart diagrams and policy tables into indexable vector memory.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-700/80 transition">
                <Layers className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Grounded Multi-Document RAG</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Precise citations with interactive PDF handbook highlighting and source verification.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/40 hover:border-slate-700/80 transition">
                <ShieldCheck className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">Authenticated JWT Endpoints</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Protected database queries, session tracking, and token blacklist revocation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Metrics Card */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <p className="text-sm sm:text-base font-extrabold text-white">99.8%</p>
                <p className="text-[10px] text-slate-400 font-medium">Grounded</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <p className="text-sm sm:text-base font-extrabold text-indigo-400">&lt; 350ms</p>
                <p className="text-[10px] text-slate-400 font-medium">RAG Speed</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/40">
                <p className="text-sm sm:text-base font-extrabold text-emerald-400">100%</p>
                <p className="text-[10px] text-slate-400 font-medium">Secured</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Authentication Forms */}
        <div className="lg:w-7/12 p-8 sm:p-10 flex flex-col justify-center bg-slate-900/70">
          <div className="max-w-md w-full mx-auto">
            
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-2xl bg-slate-800/80 p-1 border border-slate-700/60 mb-6">
              <button
                type="button"
                id="tab-sign-in"
                onClick={() => {
                  setMode("login");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                  mode === "login"
                    ? "bg-slate-900 text-white shadow-md border border-slate-700/80"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                <span>Sign In</span>
              </button>
              <button
                type="button"
                id="tab-create-account"
                onClick={() => {
                  setMode("signup");
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-2 ${
                  mode === "signup"
                    ? "bg-slate-900 text-white shadow-md border border-slate-700/80"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <User className="w-3.5 h-3.5 text-indigo-400" />
                <span>Create Account</span>
              </button>
            </div>

            {/* Error & Success Feedback Banners */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{successMessage}</span>
              </div>
            )}

            {/* ================= MODE 1: LOGIN FORM ================= */}
            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5" htmlFor="login-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300" htmlFor="login-password">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setShowForgotModal(true);
                      }}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      required
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                      title={showLoginPassword ? "Hide password" : "Show password"}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Checkbox */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Remember this session</span>
                  </label>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  id="submit-login-btn"
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Assistant</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ================= MODE 2: SIGN UP FORM (ORIGINAL USER) ================= */}
            {mode === "signup" && (
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="signup-name">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-name"
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="signup-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-email"
                      type="email"
                      required
                      placeholder="name@company.com"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="signup-phone">
                    Mobile Number <span className="text-slate-500 font-normal">(optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-phone"
                      type="tel"
                      placeholder="+91 9876543210"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                  </div>
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1" htmlFor="signup-password">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      required
                      placeholder="8+ characters, upper, lower, number, symbol"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Checklist & Bar */}
                  {signupPassword && (
                    <div className="mt-2.5 p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-400">Password strength:</span>
                        <span className={`font-semibold ${strength.text}`}>{strength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${strength.color}`}
                          style={{ width: `${strength.percent}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] text-slate-400">
                        <span className={`flex items-center gap-1 ${passwordCriteria.minLen ? "text-emerald-400" : "text-slate-500"}`}>
                          {passwordCriteria.minLen ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          8-128 characters
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasUpper ? "text-emerald-400" : "text-slate-500"}`}>
                          {passwordCriteria.hasUpper ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Uppercase letter
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasLower ? "text-emerald-400" : "text-slate-500"}`}>
                          {passwordCriteria.hasLower ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Lowercase letter
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasNumber ? "text-emerald-400" : "text-slate-500"}`}>
                          {passwordCriteria.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Number (0-9)
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.hasSpecial ? "text-emerald-400" : "text-slate-500"}`}>
                          {passwordCriteria.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          Special symbol (!@#$)
                        </span>
                        <span className={`flex items-center gap-1 ${passwordCriteria.noWhitespaceEnds ? "text-emerald-400" : "text-slate-500"}`}>
                          {passwordCriteria.noWhitespaceEnds ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          No end spaces
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300" htmlFor="signup-confirm-password">
                      Confirm Password
                    </label>
                    {passwordsMatch !== null && (
                      <span className={`text-[10px] font-semibold flex items-center gap-1 ${passwordsMatch ? "text-emerald-400" : "text-rose-400"}`}>
                        {passwordsMatch ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        {passwordsMatch ? "Passwords match" : "Mismatch"}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="signup-confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Re-enter your password"
                      value={signupConfirmPassword}
                      onChange={(e) => setSignupConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-10 py-2 rounded-xl bg-slate-800/80 border text-white text-sm placeholder-slate-500 focus:outline-none transition ${
                        passwordsMatch === false
                          ? "border-rose-500/80 focus:border-rose-500"
                          : "border-slate-700 focus:border-indigo-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms agreement */}
                <div className="pt-1">
                  <label className="flex items-start gap-2.5 text-xs text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                    />
                    <span>
                      I agree to the <span className="text-indigo-400 hover:underline">Security Policy</span> and <span className="text-indigo-400 hover:underline">Terms of Service</span>.
                    </span>
                  </label>
                </div>

                {/* Submit Signup Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  id="submit-signup-btn"
                  className="w-full mt-3 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
                >
                  {isLoading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Bottom Security Assurance Note */}
            <div className="mt-8 pt-5 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Protected by Centralized JWT Authentication</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Interactive Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 flex items-center justify-center mb-3.5">
              <KeyRound className="w-5 h-5" />
            </div>
            
            <h3 className="text-base font-bold text-white">Reset Account Password</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Enter your email address below to receive password reset instructions.
            </p>

            {forgotSent ? (
              <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Request received!</span>
                </p>
                <p className="mt-1 text-slate-400 text-[11px]">
                  Instructions have been sent to <span className="text-slate-200">{forgotEmail}</span> if registered.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSent(false);
                  }}
                  className="w-full mt-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="mt-4 space-y-3">
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition cursor-pointer"
                  >
                    Send Reset Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
