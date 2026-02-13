"use client";

import { useAuth } from "@/lib/auth-context";
import { MOCK_USERS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Role } from "@/types";
import { Shield, ChevronRight, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!selectedUser) return;

    const user = MOCK_USERS.find(u => u.id === selectedUser);

    // Simple PIN check for officers (anyone above Cadet for demo)
    if (user?.role !== Role.CADET && user?.role !== Role.CPL && user?.role !== Role.LCPL) {
      if (pin !== "1234") {
        setError("Invalid PIN. (Hint: 1234)");
        return;
      }
    }

    await login(selectedUser);
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-primary via-[#0f1730] to-black p-4">
      {/* Abstract background shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-tertiary/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md relative z-10 glass-dark rounded-3xl p-8 border border-white/10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-2xl shadow-primary/50 mb-4 border-4 border-white/10">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">NCC RGU Unit</h1>
          <p className="text-gray-400 text-sm">Secure Command Center</p>
        </div>

        <div className="space-y-6">
          {!selectedUser ? (
            <div className="space-y-3">
              <p className="text-white/60 text-sm font-medium ml-1">Select Identity</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {MOCK_USERS.map((user) => (
                  <motion.button
                    key={user.id}
                    whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedUser(user.id)}
                    className="w-full flex items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/50 transition-all group text-left"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${user.role === Role.ANO ? "bg-secondary text-white" : "bg-tertiary/20 text-tertiary"
                      }`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-medium">{user.name}</h3>
                      <span className="text-xs text-secondary font-medium tracking-wide bg-secondary/10 px-2 py-0.5 rounded-full inline-block mt-1">
                        {user.role}
                      </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                  </motion.button>
                ))}
              </div>
            </div>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold mr-3">
                      {MOCK_USERS.find(u => u.id === selectedUser)?.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="text-gray-400 text-xs">Signing in as</p>
                      <h3 className="text-white font-bold">{MOCK_USERS.find(u => u.id === selectedUser)?.name}</h3>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => { setSelectedUser(null); setError(""); setPin(""); }} className="text-gray-400 hover:text-white">
                    Change
                  </Button>
                </div>

                {/* PIN Input if not Cadet */}
                {(MOCK_USERS.find(u => u.id === selectedUser)?.role !== Role.CADET &&
                  MOCK_USERS.find(u => u.id === selectedUser)?.role !== Role.CPL &&
                  MOCK_USERS.find(u => u.id === selectedUser)?.role !== Role.LCPL) && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300 ml-1">Access PIN</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                        <Input
                          type="password"
                          placeholder="Enter PIN (1234)"
                          className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-secondary focus-visible:border-secondary"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          error={error}
                        />
                      </div>
                    </div>
                  )}

                <Button
                  className="w-full bg-gradient-to-r from-secondary to-red-600 hover:from-red-600 hover:to-secondary shadow-lg shadow-red-900/40 border-0"
                  size="lg"
                  onClick={handleLogin}
                  isLoading={isLoading}
                >
                  Access Dashboard
                </Button>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </main>
  );
}
