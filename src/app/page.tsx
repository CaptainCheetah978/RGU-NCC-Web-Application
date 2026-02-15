"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Shield, Mail, CheckCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const { login, verifyOtp, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [error, setError] = useState("");

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setError("");

    try {
      await login(email);
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setError("");

    try {
      await verifyOtp(email, otp);
    } catch (err: any) {
      setError("Invalid code. Please check and try again.");
    }
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary via-[#0f1730] to-black p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-tertiary/30 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center space-x-8 mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-22 h-22 relative"
            >
              <img src="/ncc-logo.png" alt="NCC logo" className="w-full h-full object-contain drop-shadow-2xl" />
            </motion.div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-22 h-22 relative"
            >
              <img src="/rgu-logo.png" alt="RGU logo" className="w-full h-full object-contain drop-shadow-2xl" />
            </motion.div>
          </div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-2xl font-extrabold text-white mb-2 tracking-tight text-center leading-tight mx-auto max-w-[90%]"
          >
            The Assam Royal Global University NCC
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 font-medium text-xs text-center px-4"
          >
            Secure Login Portal
          </motion.p>
        </div>

        <div className="glass-dark rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {step === "email" ? (
              <motion.form
                key="email-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSendOtp}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Sign In</h2>
                  <p className="text-gray-400 text-sm">Enter your email to receive a login code</p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <Input
                      type="email"
                      placeholder="cadet@rgu.ac.in"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-secondary focus-visible:border-secondary h-12"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      autoFocus
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs ml-1 font-medium">{error}</p>}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-to-r from-secondary to-blue-600 hover:from-blue-600 hover:to-secondary shadow-xl shadow-blue-900/40 border-0"
                  isLoading={isLoading}
                  disabled={!email || isLoading}
                >
                  Send Login Code
                </Button>
              </motion.form>
            ) : (
              <motion.form
                key="otp-form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp}
                className="space-y-6"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-white mb-2">Check your Email</h2>
                  <p className="text-gray-400 text-sm">
                    We sent a 6-digit code to <br /> <span className="text-white font-medium">{email}</span>
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <Input
                      type="text"
                      placeholder="123456"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-secondary focus-visible:border-secondary h-12 text-lg tracking-[0.5em] font-bold text-center"
                      value={otp}
                      onChange={(e) => {
                        setOtp(e.target.value);
                        setError("");
                      }}
                      maxLength={6}
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs ml-1 font-medium">{error}</p>}
                </div>

                <div className="flex flex-col space-y-3">
                  <Button
                    type="submit"
                    className="w-full h-12 text-lg bg-gradient-to-r from-secondary to-green-600 hover:from-green-600 hover:to-secondary shadow-xl shadow-green-900/40 border-0"
                    isLoading={isLoading}
                    disabled={otp.length < 6 || isLoading}
                  >
                    Verify & Login
                  </Button>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-gray-500 text-xs hover:text-white transition-colors"
                  >
                    Wrong email? Go back
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-widest font-bold">
          Restricted Access • Authentic Personnel Only
        </p>
      </div>
    </main>
  );
}
