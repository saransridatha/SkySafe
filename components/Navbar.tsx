"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "../styles/navbar.css";

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [query, setQuery] = useState("");
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
        { href: "/", label: "Home" },
        { href: "/explore", label: "Explore" },
        { href: "/about", label: "About" },
    ];

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link href="/" className="navbar-brand">
                    <span className="navbar-logo">
                        Sky<span>Safe</span>
                    </span>
                </Link>

                <ul className="navbar-links">
                    {links.map((l) => (
                        <li key={l.href}>
                            <Link
                                href={l.href}
                                className={`navbar-link${pathname === l.href ? " active" : ""}`}
                            >
                                {l.label}
                            </Link>
                        </li>
                    ))}
                </ul>

                <form onSubmit={handleSubmit} className="navbar-search">
                    <span className="navbar-search-icon">🔍</span>
                    <input
                        ref={inputRef}
                        type="text"
                        className="navbar-search-input"
                        placeholder="Search flight..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoComplete="off"
                    />
                    <kbd className="navbar-search-kbd">/</kbd>
                </form>
            </div>
        </nav>
    );
}
