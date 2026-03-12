"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Activity, Radio, Search } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { AuthModal } from "./AuthModal";

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [query, setQuery] = useState("");
    const [showAuth, setShowAuth] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            const tag = (e.target as HTMLElement)?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
            if (e.key === "/" || (e.key === "k" && (e.ctrlKey || e.metaKey))) {
                e.preventDefault();
                inputRef.current?.focus();
            }
        }
        document.addEventListener("keydown", handleKey);
        return () => document.removeEventListener("keydown", handleKey);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            router.push(`/report?flight=${encodeURIComponent(trimmed)}`);
            setQuery("");
            inputRef.current?.blur();
        }
    };

    const links = [
        { href: "/", label: "COMMAND" },
        { href: "/explore", label: "EXPLORE" },
        { href: "/about", label: "ABOUT" },
    ];

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/90 backdrop-blur-md">
                <div className="flex items-center justify-between px-4 h-12">
                    {/* Left - Logo & Brand */}
                    <Link href="/" className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-electric" />
                        <span className="font-heading text-sm font-bold tracking-[0.2em] text-foreground">
                            SKYSAFE
                        </span>
                        <div className="h-4 w-px bg-border ml-2" />
                        <span className="font-mono-label text-[9px] text-muted-foreground tracking-wider">v4.2.1</span>
                    </Link>

                    {/* Center - Nav Links */}
                    <div className="hidden md:flex items-center gap-1">
                        {links.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`font-mono-label text-[10px] tracking-[0.15em] px-4 py-1 border transition-all ${
                                    pathname === link.href
                                        ? "border-electric/40 bg-electric/10 text-electric"
                                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                                }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* Right section */}
                    <div className="flex items-center gap-4">
                        {/* Search */}
                        <form onSubmit={handleSubmit} className="hidden sm:flex items-center gap-2">
                            <div className="flex items-center border border-border bg-background/50 px-2 py-1">
                                <Search className="w-3 h-3 text-muted-foreground" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    className="bg-transparent border-none outline-none font-mono-data text-[10px] text-foreground placeholder:text-muted-foreground w-24 ml-2 tracking-wider"
                                    placeholder="SEARCH..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    autoComplete="off"
                                />
                                <kbd className="font-mono-label text-[8px] text-muted-foreground border border-border px-1">/</kbd>
                            </div>
                        </form>

                        {/* Status indicators */}
                        <div className="hidden lg:flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                                <Radio className="w-3 h-3 text-neon pulse-glow" />
                                <span className="font-mono-label text-[9px] text-neon tracking-wider">ONLINE</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <Activity className="w-3 h-3 text-electric" />
                                <span className="font-mono-data text-[9px] text-muted-foreground">99.97%</span>
                            </div>
                        </div>

                        {/* Auth */}
                        {user ? (
                            <div className="flex items-center gap-2">
                                <span className="font-mono-label text-[9px] text-electric tracking-wider hidden sm:inline">
                                    {user.name.toUpperCase()}
                                </span>
                                <button 
                                    onClick={logout} 
                                    className="font-mono-label text-[9px] text-muted-foreground border border-border px-2 py-1 hover:border-destructive hover:text-destructive transition-colors tracking-wider"
                                >
                                    LOGOUT
                                </button>
                            </div>
                        ) : (
                            <button 
                                onClick={() => setShowAuth(true)} 
                                className="font-mono-label text-[9px] text-electric border border-electric/40 px-3 py-1 hover:bg-electric/10 transition-colors tracking-wider"
                            >
                                ACCESS
                            </button>
                        )}
                    </div>
                </div>

                {/* Bottom thin data bar */}
                <div className="h-px w-full bg-gradient-to-r from-transparent via-electric/30 to-transparent" />
            </nav>

            <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
        </>
    );
}
