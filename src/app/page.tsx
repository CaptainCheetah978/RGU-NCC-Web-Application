"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Shield, User, Lock, ChevronRight, Loader2, Mail, KeyRound, ArrowLeft, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Role } from "@/types";

type LoginStep = "login" | "forgot-email" | "forgot-otp" | "forgot-newpin" | "forgot-done";

export default function LoginPage() {
  const { loginWithPassword, resetPin, updatePin, verifyOtp } = useAuth();
  const [activeTab, setActiveTab] = useState<Role>(Role.CADET);
  const [formData, setFormData] = useState({ username: "", pin: "" });
  const [error, setError] = useState("");
  const [isRestoring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<LoginStep>("login");

  // --- Rate limiting ---
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_SECONDS = 60;
  const failCountRef = useRef(0);
  const lockoutUntilRef = useRef<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clean up lockout timer on unmount
  useEffect(() => () => { if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current); }, []);

  // Forgot PIN state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    // Check lockout
    const now = Date.now();
    if (lockoutUntilRef.current > now) {
      const remaining = Math.ceil((lockoutUntilRef.current - now) / 1000);
      setLockoutRemaining(remaining);
      setError(`Too many failed attempts. Try again in ${remaining} seconds.`);
      setSubmitting(false);
      return;
    }

    const cleanUsername = formData.username.replace(/\s+/g, '').toLowerCase();
    const pseudoEmail = `${activeTab.toLowerCase()}_${cleanUsername}@nccrgu.internal`;

    try {
      await loginWithPassword(pseudoEmail, formData.pin);
      // Success!
      failCountRef.current = 0;
      setLockoutRemaining(0);
      setSubmitting(false);
      return;
    } catch (err: unknown) {
      // If modern prefix (csuo/cjuo) failed, try legacy fallback (suo/uo)
      if (activeTab === Role.CSUO || activeTab === Role.CJUO) {
        const legacyPrefix = activeTab === Role.CSUO ? "suo" : "uo";
        const legacyEmail = `${legacyPrefix}_${cleanUsername}@nccrgu.internal`;
        try {
          await loginWithPassword(legacyEmail, formData.pin);
          // Success with legacy email!
          failCountRef.current = 0;
          setLockoutRemaining(0);
          setSubmitting(false);
          return;
        } catch (error) {
          console.error("Auto-login error:", error);
        }
      }

      setError(err instanceof Error ? err.message : "Invalid credentials. Contact your ANO.");
      // Increment failed attempts
      failCountRef.current += 1;
      if (failCountRef.current >= MAX_ATTEMPTS) {
        lockoutUntilRef.current = Date.now() + LOCKOUT_SECONDS * 1000;
        setLockoutRemaining(LOCKOUT_SECONDS);
        setError(`Too many failed attempts. Locked for ${LOCKOUT_SECONDS} seconds.`);
        // Start countdown (clear any existing timer first)
        if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
        lockoutTimerRef.current = setInterval(() => {
          const rem = Math.ceil((lockoutUntilRef.current - Date.now()) / 1000);
          if (rem <= 0) {
            setLockoutRemaining(0);
            failCountRef.current = 0;
            if (lockoutTimerRef.current) clearInterval(lockoutTimerRef.current);
            lockoutTimerRef.current = null;
          } else {
            setLockoutRemaining(rem);
          }
        }, 1000);
      }
      setSubmitting(false);
    }
  };

  const handleForgotEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setForgotLoading(true);
    try {
      await resetPin(forgotEmail);
      setStep("forgot-otp");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send OTP. Check the email and try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setForgotLoading(true);
    try {
      await verifyOtp(forgotEmail, forgotOtp, true); // skipRedirect — stay on login to set new PIN
      setStep("forgot-newpin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid or expired OTP.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleNewPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPin !== confirmPin) {
      setError("PINs do not match.");
      return;
    }
    if (newPin.length < 4) {
      setError("PIN must be at least 4 characters.");
      return;
    }
    setForgotLoading(true);
    try {
      await updatePin(newPin);
      setStep("forgot-done");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update PIN.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgotFlow = () => {
    setStep("login");
    setForgotEmail("");
    setForgotOtp("");
    setNewPin("");
    setConfirmPin("");
    setError("");
  };

  const tabs = [
    { id: Role.ANO, label: "ANO", icon: Shield, color: "from-red-600 to-red-800" },
    { id: Role.CSUO, label: "CSUO", icon: User, color: "from-blue-600 to-blue-800" },
    { id: Role.CADET, label: "Cadet", icon: User, color: "from-green-600 to-green-800" }
  ];
  const activeColor = tabs.find(t => t.id === activeTab)?.color || "from-blue-600 to-blue-800";

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br ${activeColor} rounded-full blur-[150px] transition-all duration-1000`} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-4 mb-6">
            <Image src="/ncc-logo.png" alt="NCC" width={64} height={64} className="w-16 h-16 object-contain drop-shadow-2xl" />
            <div className="h-12 w-[1px] bg-white/20"></div>
            <Image src="/rgu-logo.png" alt="RGU" width={64} height={64} className="w-16 h-16 object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">NCC Management</h1>
          <p className="text-zinc-300 text-sm mt-1 font-bold">Royal Global University Unit</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            {step === "login" && (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Role Tabs */}
                <div className="grid grid-cols-3 border-b border-white/5">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setError(""); setFormData({ username: "", pin: "" }); }}
                      className={`relative py-4 text-sm font-black transition-all duration-300 ${activeTab === tab.id ? "text-white bg-white/5" : "text-zinc-400 hover:text-gray-200 hover:bg-white/5"}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-white" : ""}`} />
                        <span>{tab.label}</span>
                      </div>
                      {activeTab === tab.id && (
                        <motion.div layoutId="activeTab" className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tab.color}`} />
                      )}
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">
                          {activeTab === Role.ANO ? "Officer ID" : activeTab === Role.CADET ? "Regimental Number" : "Username"}
                        </label>
                        <div className="relative mt-1">
                          <User className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                          <Input
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            placeholder={activeTab === Role.ANO ? "ANO" : activeTab === Role.CADET ? "e.g. SW/RGU/1234" : "e.g. Rahul Singh"}
                            className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary font-bold"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-black text-zinc-300 uppercase tracking-widest ml-1">
                          {activeTab === Role.ANO ? "Secure PIN" : "Access PIN"}
                        </label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-3 w-5 h-5 text-zinc-500" />
                          <Input
                            type="password"
                            value={formData.pin}
                            onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                            placeholder="••••"
                            className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus-visible:ring-primary tracking-widest font-bold"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      className={`w-full h-12 text-lg font-bold bg-gradient-to-r ${activeColor} border-0 shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]`}
                      disabled={submitting || isRestoring || lockoutRemaining > 0}
                    >
                      {(submitting || isRestoring) ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>Access Dashboard <ChevronRight className="w-5 h-5 ml-1 opacity-80" /></>
                      )}
                    </Button>

                    {activeTab === Role.ANO && (
                      <button
                        type="button"
                        onClick={() => { setStep("forgot-email"); setError(""); }}
                        className="w-full text-center text-xs text-zinc-300 hover:text-red-400 transition-colors mt-2 font-bold uppercase tracking-widest"
                      >
                        Forgot PIN? Reset via Email OTP
                      </button>
                    )}
                  </form>
                </div>
              </motion.div>
            )}

            {step === "forgot-email" && (
              <motion.div key="forgot-email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-8 space-y-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <button aria-label="Go back to login" onClick={resetForgotFlow} className="text-gray-500 hover:text-white transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-white font-bold text-lg">Reset ANO PIN</h2>
                      <p className="text-gray-400 text-xs">Enter your registered Supabase email</p>
                    </div>
                  </div>
                  <form onSubmit={handleForgotEmailSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <Input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="ano@example.com"
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600"
                        required
                      />
                    </div>
                    {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-red-600 to-red-800 border-0" disabled={forgotLoading}>
                      {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send OTP to Email"}
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {step === "forgot-otp" && (
              <motion.div key="forgot-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-8 space-y-6">
                  <div className="flex items-center space-x-3 mb-2">
                    <button aria-label="Go back to email entry" onClick={() => setStep("forgot-email")} className="text-gray-500 hover:text-white transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-white font-bold text-lg">Enter OTP</h2>
                      <p className="text-gray-400 text-xs">Check your inbox for the 6-digit code</p>
                    </div>
                  </div>
                  <form onSubmit={handleForgotOtpSubmit} className="space-y-4">
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <Input
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value)}
                        placeholder="6-digit OTP"
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 tracking-widest font-mono"
                        maxLength={6}
                        required
                      />
                    </div>
                    {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-red-600 to-red-800 border-0" disabled={forgotLoading}>
                      {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify OTP"}
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {step === "forgot-newpin" && (
              <motion.div key="forgot-newpin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="p-8 space-y-6">
                  <div>
                    <h2 className="text-white font-bold text-lg">Set New PIN</h2>
                    <p className="text-gray-400 text-xs mt-1">Choose a secure PIN for your ANO account</p>
                  </div>
                  <form onSubmit={handleNewPinSubmit} className="space-y-4">
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <Input
                        type="password"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        placeholder="New PIN"
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 tracking-widest"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                      <Input
                        type="password"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        placeholder="Confirm New PIN"
                        className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 tracking-widest"
                        required
                      />
                    </div>
                    {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
                    <Button type="submit" className="w-full h-12 bg-gradient-to-r from-red-600 to-red-800 border-0" disabled={forgotLoading}>
                      {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save New PIN"}
                    </Button>
                  </form>
                </div>
              </motion.div>
            )}

            {step === "forgot-done" && (
              <motion.div key="forgot-done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="text-white font-bold text-xl">PIN Updated!</h2>
                  <p className="text-gray-400 text-sm">You can now log in with your new PIN.</p>
                  <Button onClick={resetForgotFlow} className="w-full h-12 bg-gradient-to-r from-red-600 to-red-800 border-0 mt-4">
                    Back to Login
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-zinc-400 text-[10px] mt-8 uppercase tracking-widest font-black opacity-80">
          Restricted Area • {activeTab} Classification
        </p>
      </div>
    </main>
  );
}
