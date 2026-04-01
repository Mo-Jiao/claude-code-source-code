"use client";

import Link from "next/link";
import { Github, Menu, X, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-bold">
          Claude Code Tutorial
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          <button
            onClick={toggleDark}
            className="rounded-md p-1.5 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white"
          >
            {mounted ? (dark ? <Sun size={16} /> : <Moon size={16} />) : <span className="w-4 h-4 inline-block" />}
          </button>

          <a
            href="https://github.com/anthropics/claude-code"
            target="_blank"
            rel="noopener"
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white"
          >
            <Github size={18} />
          </a>
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex min-h-[44px] min-w-[44px] items-center justify-center md:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--color-border)] bg-[var(--color-bg)] p-4 md:hidden">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleDark}
              className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white"
            >
              {mounted ? (dark ? <Sun size={18} /> : <Moon size={18} />) : <span className="w-[18px] h-[18px] inline-block" />}
            </button>
            <a
              href="https://github.com/anthropics/claude-code"
              target="_blank"
              rel="noopener"
              className="flex min-h-[44px] min-w-[44px] items-center justify-center text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-white"
            >
              <Github size={18} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
