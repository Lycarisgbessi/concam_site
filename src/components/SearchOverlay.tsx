import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X, ArrowUpRight, Loader2 } from 'lucide-react';
import { useSite } from '../context/SiteContext';
import type { SearchResultItem } from '../types/concam';

export function SearchOverlay() {
  const { searchOpen, setSearchOpen, lang } = useSite();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  useEffect(() => {
    if (!searchOpen) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [searchOpen, setSearchOpen]);

  useEffect(() => {
    if (!searchOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/public/search?q=${encodeURIComponent(trimmed)}&lang=${lang}`,
          { signal: controller.signal },
        );
        if (res.ok) {
          const json = await res.json();
          setResults(Array.isArray(json.results) ? json.results : []);
        }
      } catch {
        // Abort or transient error
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query, lang, searchOpen]);

  const typeLabel = (t: SearchResultItem['type']) => {
    if (t === 'service') return p('Pôle métier', 'Service');
    if (t === 'gallery') return p('Réalisation', 'Portfolio');
    return p('Publication', 'Article');
  };

  const goFullSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setSearchOpen(false);
    navigate(`${p('/recherche', '/en/search')}${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <AnimatePresence>
      {searchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-[#110D0C]/80 backdrop-blur-sm flex items-start justify-center pt-16 sm:pt-24 px-4"
          onClick={() => setSearchOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={p('Recherche sur le site CONCAM', 'Search CONCAM website')}
        >
          <motion.div
            initial={{ opacity: 0, y: -14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-page text-ink border border-[#181413]/20 rounded-[4px] shadow-2xl overflow-hidden"
          >
            <form onSubmit={goFullSearch} className="bg-[#110D0C] border-b border-[#931916] px-4 sm:px-5 py-3.5 flex items-center gap-3">
              <Search className="w-4 h-4 text-[#E40014] shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={p(
                  'Rechercher un service, une réalisation, un article (ex. impression offset, manuels, kakémonos)...',
                  'Search services, portfolio projects, insights...',
                )}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
              />
              {loading && <Loader2 className="w-4 h-4 text-[#E40014] animate-spin shrink-0" />}
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label={p('Fermer la recherche', 'Close search')}
                className="p-1.5 text-[#D6CEC2] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </form>

            <div className="max-h-[60vh] overflow-y-auto divide-y divide-hairline">
              {!query.trim() ? (
                <div className="p-6 text-xs text-muted space-y-3">
                  <p className="uppercase tracking-[0.16em] font-semibold text-accent">
                    {p('Recherches fréquentes', 'Suggested topics')}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      p('Impression offset', 'Offset printing'),
                      p('Manuels scolaires', 'Educational manuals'),
                      p('Marquage véhicules', 'Vehicle branding'),
                      p('Conseil institutionnel', 'Institutional advisory'),
                      p('Réussite Magazine', 'Réussite Magazine'),
                    ].map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setQuery(term)}
                        className="px-3 py-1.5 text-xs bg-surface border border-hairline hover:border-[#931916] text-ink rounded-[4px] cursor-pointer transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 && !loading ? (
                <div className="p-8 text-center text-sm text-muted">
                  {p(
                    'Aucun résultat exact pour cette recherche. Essayez un autre mot-clé ou consultez nos pôles de services.',
                    'No exact match found. Try another keyword or browse our service pillars.',
                  )}
                </div>
              ) : (
                results.slice(0, 8).map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    to={item.href}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-start gap-4 p-4 hover:bg-limestone transition-colors group"
                  >
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-14 h-12 object-cover rounded-[4px] border border-hairline shrink-0 hidden sm:block"
                       loading="lazy" decoding="async" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-accent font-semibold">
                        <span>{typeLabel(item.type)}</span>
                        <span className="text-faint">·</span>
                        <span className="text-muted truncate">{item.subtitle}</span>
                      </div>
                      <p className="font-serif text-lg font-bold text-ink group-hover:text-accent transition-colors truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted line-clamp-1">{item.excerpt}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-accent shrink-0 mt-1 opacity-60 group-hover:opacity-100" />
                  </Link>
                ))
              )}
            </div>

            <div className="bg-limestone border-t border-hairline px-4 py-2.5 flex items-center justify-between text-[11px] text-muted">
              <span>
                {p('Raccourci : ⌘K / Ctrl+K · Échap pour fermer', 'Shortcut: ⌘K / Ctrl+K · Esc to close')}
              </span>
              {query.trim() && (
                <button
                  type="button"
                  onClick={() => goFullSearch({ preventDefault: () => {} } as React.FormEvent)}
                  className="font-semibold text-accent hover:underline cursor-pointer"
                >
                  {p(`Voir tous les résultats (${results.length})`, `View all results (${results.length})`)}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
