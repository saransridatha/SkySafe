"use client";

import { useState, useRef, useEffect } from "react";
import "../styles/search-bar.css";

interface SearchSuggestion {
  id: string;
  type: "flight" | "route";
  display: string;
  route?: string;
  value: string;
}

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

// Mock recent searches - in production, this would come from localStorage or API
const MOCK_RECENT_SEARCHES: SearchSuggestion[] = [
  {
    id: "1",
    type: "flight",
    display: "AI 101",
    route: "DEL → LHR",
    value: "AI 101",
  },
  {
    id: "2",
    type: "route",
    display: "DEL → MUM",
    value: "DEL,MUM",
  },
  {
    id: "3",
    type: "flight",
    display: "BA 112",
    route: "LHR → JFK",
    value: "BA 112",
  },
];

export function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle outside click to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard shortcut (/) to focus search
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.key === "/" || (e.key === "k" && (e.ctrlKey || e.metaKey)))) {
        const input = containerRef.current?.querySelector(
          ".search-input"
        ) as HTMLInputElement;
        if (input) {
          e.preventDefault();
          input.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.length > 0) {
      // Filter mock suggestions based on query
      const filtered = MOCK_RECENT_SEARCHES.filter(
        (s) =>
          s.display.toLowerCase().includes(value.toLowerCase()) ||
          s.route?.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions(MOCK_RECENT_SEARCHES);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.display);
    setShowSuggestions(false);
    onSearch(suggestion.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      onSearch(query);
    }
  };

  return (
    <div className="search-bar-container" ref={containerRef}>
      <form onSubmit={handleSubmit} className="search-bar-wrapper">
        <div className="search-bar-wrapper">
          <span className="search-icon">✈️</span>
          <input
            type="text"
            className="search-input"
            placeholder="Flight number (AI 101) or route (DEL → LHR)"
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.length === 0) {
                setSuggestions(MOCK_RECENT_SEARCHES);
              }
              setShowSuggestions(true);
            }}
            disabled={isLoading}
            autoComplete="off"
            aria-label="Search flights or routes"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="search-suggestion-item"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <span className="suggestion-flight-code">
                    {suggestion.type === "flight" ? "✈" : "🌍"} {suggestion.display}
                  </span>
                  {suggestion.route && (
                    <span className="suggestion-route">{suggestion.route}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="search-btn"
          disabled={!query.trim() || isLoading}
        >
          {isLoading ? "Searching..." : "Analyze Flight"}
        </button>
      </form>
    </div>
  );
}
