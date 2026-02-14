"use client";

import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Role } from "@/types";
import { Shield, ChevronRight, Lock, Users, ArrowLeft, Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type LoginStep = "selection" | "ano-pin" | "cadet-list" | "cadet-pin";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { messageableUsers } = useData();
  const [step, setStep] = useState<LoginStep>("selection");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const filteredCadets = useMemo(() => {
    return messageableUsers.filter(u =>
      u.role !== Role.ANO &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.regimentalNumber?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [messageableUsers, searchQuery]);

  const handleUserSelect = (userId: string) => {
    const user = messageableUsers.find(u => u.id === userId);
    if (!user) return;

    setSelectedUser(userId);
    setError("");
    setPin("");

    // Check if user needs PIN
    if (user.role !== Role.CADET && user.role !== Role.CPL && user.role !== Role.LCPL) {
      setStep(user.role === Role.ANO ? "ano-pin" : "cadet-pin");
    } else {
      handleLogin(userId);
    }
  };

  const handleLogin = async (userId?: string, overridePin?: string) => {
    const id = userId || selectedUser;
    if (!id) return;

    const user = messageableUsers.find(u => u.id === id);
    const pinToSubmit = overridePin || pin;

    // PIN check for officers
    if (user?.role !== Role.CADET && user?.role !== Role.CPL && user?.role !== Role.LCPL) {
      if (!user?.pin || pinToSubmit !== user.pin) {
        setError("Invalid Access PIN");
        return;
      }
    }

    await login(id);
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
              className="w-20 h-20 relative"
            >
              <img src="/ncc-logo.png" alt="NCC logo" className="w-full h-full object-contain drop-shadow-2xl" />
            </motion.div>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-24 h-24 relative"
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
            Welcome to The Assam Royal Global University NCC
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-400 font-medium text-xs text-center px-4"
          >
            Please select from below for proceeding to dashboard
          </motion.p>
        </div>

        <div className="glass-dark rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === "selection" && (
              <motion.div
                key="selection"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6 flex-1 flex flex-col justify-center"
              >
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-white mb-2">Identify Yourself</h2>
                  <p className="text-gray-400 text-sm">Select your role to proceed</p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <button
                    onClick={() => handleUserSelect("ano-1")}
                    className="group relative p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-secondary/50 hover:bg-white/10 transition-all text-left overflow-hidden h-32 flex items-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                      <Shield className="w-8 h-8 text-secondary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">ANO Login</h3>
                      <p className="text-gray-400 text-sm">Officer entry point</p>
                    </div>
                    <ChevronRight className="absolute right-6 w-6 h-6 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>

                  <button
                    onClick={() => setStep("cadet-list")}
                    className="group relative p-6 rounded-2xl bg-white/5 border border-white/5 hover:border-primary/50 hover:bg-white/10 transition-all text-left overflow-hidden h-32 flex items-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mr-6 group-hover:scale-110 transition-transform">
                      <Users className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Cadet Login</h3>
                      <p className="text-gray-400 text-sm">Unit member access</p>
                    </div>
                    <ChevronRight className="absolute right-6 w-6 h-6 text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  </button>
                </div>
              </motion.div>
            )}

            {step === "cadet-list" && (
              <motion.div
                key="cadet-list"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 flex-1 flex flex-col"
              >
                <div className="flex items-center mb-2">
                  <button onClick={() => setStep("selection")} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold text-white ml-2">Find Your Profile</h2>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search name or rank..."
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-2 max-h-[300px] custom-scrollbar">
                  {filteredCadets.length > 0 ? (
                    filteredCadets.map((user) => (
                      <motion.button
                        key={user.id}
                        whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.08)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleUserSelect(user.id)}
                        className="w-full flex items-center p-3 rounded-xl bg-white/5 border border-transparent hover:border-white/10 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center text-sm font-bold text-white mr-3 shadow-lg overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user.name.charAt(0)
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium text-sm">{user.name}</h3>
                          <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">
                            {user.role}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </motion.button>
                    ))
                  ) : (
                    <div className="py-10 text-center text-gray-500">
                      <p className="text-sm">No profiles match your search.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {(step === "ano-pin" || step === "cadet-pin") && (
              <motion.div
                key="pin-input"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6 flex-1 flex flex-col justify-center"
              >
                <div className="flex items-center mb-2">
                  <button onClick={() => setStep(step === "ano-pin" ? "selection" : "cadet-list")} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold text-white ml-2">Verification Required</h2>
                </div>

                <div className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold mr-4 shadow-lg shrink-0 overflow-hidden">
                    {(() => {
                      const selected = messageableUsers.find(u => u.id === selectedUser);
                      return selected?.avatarUrl ? (
                        <img src={selected.avatarUrl} alt={selected.name} className="w-full h-full object-cover" />
                      ) : (
                        selected?.name.charAt(0)
                      );
                    })()}
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Signing in as</p>
                    <h3 className="text-white font-bold">{messageableUsers.find(u => u.id === selectedUser)?.name}</h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 ml-1">Access PIN</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <Input
                      type="password"
                      placeholder="Enter 4-digit PIN"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-secondary focus-visible:border-secondary h-12 text-lg tracking-[0.5em] font-bold"
                      value={pin}
                      onChange={(e) => {
                        setPin(e.target.value);
                        if (error) setError("");
                      }}
                      error={error}
                      autoFocus
                    />
                  </div>
                  {error && <p className="text-red-500 text-xs ml-1 font-medium">{error}</p>}
                </div>

                <Button
                  className="w-full h-12 text-lg bg-gradient-to-r from-secondary to-red-600 hover:from-red-600 hover:to-secondary shadow-xl shadow-red-900/40 border-0"
                  onClick={() => handleLogin()}
                  isLoading={isLoading}
                  disabled={pin.length < 4}
                >
                  Confirm Identity
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
