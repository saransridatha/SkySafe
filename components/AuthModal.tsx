"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, User, Mail, AlertTriangle } from "lucide-react";
import { useAuth } from "./AuthProvider";

export function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onClose();
      setEmail("");
      setPassword("");
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="hud-panel glow-blue w-full max-w-md mx-4 p-6 relative"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <Lock className="w-5 h-5 text-electric" />
              <div>
                <h2 className="font-heading text-sm font-bold text-foreground tracking-wider">
                  {mode === "login" ? "SYSTEM ACCESS" : "NEW CLEARANCE"}
                </h2>
                <p className="font-mono-label text-[9px] text-muted-foreground tracking-widest">
                  {mode === "login" ? "AUTHENTICATE TO CONTINUE" : "REGISTER FOR SYSTEM ACCESS"}
                </p>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 border border-destructive/30 bg-destructive/10 p-3 mb-4">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="font-mono-data text-[10px] text-destructive">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "register" && (
                <div>
                  <label className="font-mono-label text-[9px] text-muted-foreground tracking-wider block mb-1">
                    CALLSIGN
                  </label>
                  <div className="flex items-center border border-border bg-background/50 px-3 py-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      required
                      autoComplete="name"
                      className="flex-1 bg-transparent border-none outline-none font-mono-data text-sm text-foreground placeholder:text-muted-foreground ml-2"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-mono-label text-[9px] text-muted-foreground tracking-wider block mb-1">
                  IDENTIFIER
                </label>
                <div className="flex items-center border border-border bg-background/50 px-3 py-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="flex-1 bg-transparent border-none outline-none font-mono-data text-sm text-foreground placeholder:text-muted-foreground ml-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono-label text-[9px] text-muted-foreground tracking-wider block mb-1">
                  ACCESS CODE
                </label>
                <div className="flex items-center border border-border bg-background/50 px-3 py-2">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Min. 8 characters" : "Your password"}
                    required
                    minLength={mode === "register" ? 8 : 1}
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="flex-1 bg-transparent border-none outline-none font-mono-data text-sm text-foreground placeholder:text-muted-foreground ml-2"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full font-mono-label text-[10px] text-electric border border-electric/40 px-4 py-3 hover:bg-electric/10 transition-colors tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "AUTHENTICATING..." : mode === "login" ? "AUTHENTICATE" : "REQUEST ACCESS"}
              </button>
            </form>

            {/* Switch mode */}
            <div className="mt-6 pt-4 border-t border-border text-center">
              <span className="font-mono-label text-[9px] text-muted-foreground">
                {mode === "login" ? "NO CLEARANCE?" : "EXISTING CLEARANCE?"}
              </span>
              <button
                onClick={switchMode}
                className="font-mono-label text-[9px] text-electric hover:text-neon transition-colors tracking-wider ml-2"
              >
                {mode === "login" ? "REQUEST ACCESS" : "AUTHENTICATE"}
              </button>
            </div>

            {/* Bottom decoration */}
            <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between">
              <div className="flex gap-[2px]">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-electric/10" style={{ width: i % 2 === 0 ? 2 : 1, height: 4 }} />
                ))}
              </div>
              <span className="font-mono-data text-[7px] text-muted-foreground">SEC-LEVEL: ALPHA</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
