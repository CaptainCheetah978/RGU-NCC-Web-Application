"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Shield, User, Lock, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Role } from "@/types";

export default function LoginPage() {
  const { loginWithPassword, signupWithPassword, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<Role>(Role.CADET);
  const [formData, setFormData] = useState({
    username: "",
    pin: ""
  });
  const [error, setError] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Generate pseudo-email for Supabase Auth
    // Format: role_username_clean@nccrgu.internal
    const cleanUsername = formData.username.replace(/\s+/g, '').toLowerCase();
    const pseudoEmail = `${activeTab.toLowerCase()}_${cleanUsername}@nccrgu.internal`;
    // PIN as password

    try {
      await loginWithPassword(pseudoEmail, formData.pin);
    } catch (err: any) {
      console.log("Login failed, checking if first time...", err);

      // Auto-signup logic for initial "No Accounts" state
      // If specific known credentials or purely first-time user pattern
      if (activeTab === Role.ANO && formData.username.toUpperCase() === "ANO" && formData.pin === "0324") {
        setIsRestoring(true);
        try {
          await signupWithPassword(pseudoEmail, formData.pin, "Associate NCC Officer", Role.ANO);
        } catch (signupErr: any) {
          setError("Failed to initialize ANO account. " + signupErr.message);
          setIsRestoring(false);
        }
      } else if (err.message.includes("Invalid login credentials") || err.message.includes("Email not confirmed")) {
        // For Cadets/SUOs, if they don't exist, we might want to auto-create them IF the PIN matches a "Secret Unit Code" 
        // OR providing a fallback instruction.
        // For now, let's treat "Demo Credentials" as auto-signup keys too?
        if (formData.pin === "1234" || formData.pin === "2468") { // Demo PINs from README
          setIsRestoring(true);
          try {
            await signupWithPassword(pseudoEmail, formData.pin, formData.username, activeTab);
          } catch (signupErr: any) {
            setError("Failed to create account. " + signupErr.message);
            setIsRestoring(false);
          }
        } else {
          setError("Invalid credentials. If this is your first time, contact ANO.");
        }
      } else {
        setError(err.message || "Login failed.");
      }
    }
  };

  const tabs = [
    { id: Role.ANO, label: "ANO", icon: Shield, color: "from-red-600 to-red-800" },
    { id: Role.SUO, label: "SUO", icon: User, color: "from-blue-600 to-blue-800" },
    { id: Role.CADET, label: "Cadet", icon: User, color: "from-green-600 to-green-800" }
  ];

  const activeColor = tabs.find(t => t.id === activeTab)?.color || "from-blue-600 to-blue-800";

  return (
    <main className="min-h-screen w-full flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br ${activeColor} rounded-full blur-[150px] transition-all duration-1000`} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center space-x-4 mb-6">
            <img src="/ncc-logo.png" alt="NCC" className="w-16 h-16 object-contain drop-shadow-2xl" />
            <div className="h-12 w-[1px] bg-white/20"></div>
            <img src="/rgu-logo.png" alt="RGU" className="w-16 h-16 object-contain drop-shadow-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">NCC Management</h1>
          <p className="text-gray-400 text-sm mt-1">Royal Global University Unit</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Role Tabs */}
          <div className="grid grid-cols-3 border-b border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(""); setFormData({ username: "", pin: "" }); }}
                className={`relative py-4 text-sm font-medium transition-all duration-300 ${activeTab === tab.id ? "text-white bg-white/5" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-white" : ""}`} />
                  <span>{tab.label}</span>
                </div>
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${tab.color}`}
                  />
                )}
              </button>
            ))}
          </div>

          <div className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                    {activeTab === Role.ANO ? "Officer ID" : activeTab === Role.CADET ? "Your Name or Regt No" : "Username"}
                  </label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder={activeTab === Role.ANO ? "ANO" : "e.g. Rahul Singh"}
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">
                    {activeTab === Role.ANO ? "Secure PIN" : "Access PIN"}
                  </label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                    <Input
                      type="password"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="••••"
                      className="pl-10 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-primary tracking-widest"
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
                disabled={isLoading || isRestoring}
              >
                {(isLoading || isRestoring) ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Access Dashboard <ChevronRight className="w-5 h-5 ml-1 opacity-80" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-gray-600 text-[10px] mt-8 uppercase tracking-widest font-bold opacity-60">
          Restricted Area • {activeTab} Classification
        </p>
      </div>
    </main>
  );
}
