import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ArrowUpRight } from 'lucide-react';
import { SeoHead } from '../components/SeoHead';
import { AnimatedPageHeader, LUXURY_HEADER_IMAGES } from '../components/AnimatedPageHeader';
import {
  ParallaxBackdropPlate,
  ParallaxColumnStagger,
  ParallaxHorizontalTitle,
  ParallaxImageFrame,
  ParallaxLayer,
  RevealBlock,
} from '../components/MotionPrimitives';
import { useSite } from '../context/SiteContext';
import type { SearchResultItem } from '../types/concam';

export function SearchPage() {
  const { lang } = useSite();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);
  const [filterType, setFilterType] = useState<'all' | 'service' | 'gallery' | 'blog'>('all');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const p = (fr: string, en: string) => (lang === 'en' ? en : fr);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    setQuery(qParam);
    if (!qParam.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    fetch(`/api/public/search?q=${encodeURIComponent(qParam.trim())}&lang=${lang}`)
      .then((r) => r.json())
      .then((json) => setResults(Array.isArray(json.results) ? json.results : []))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [searchParams, lang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      setSearchParams({ q: trimmed });
    } else {
      setSearchParams({});
    }
  };

  const filtered = filterType === 'all' ? results : results.filter((r) => r.type === filterType);

  return (
    <>
      <SeoHead
        customTitle={p('Recherche interne — CONCAM Conakry', 'Internal Search — CONCAM Conakry')}
        customDescription={p(
          'Recherchez parmi les services de communication, réalisations et publications éditoriales de CONCAM.',
          'Search CONCAM communication services, portfolio case studies and publications.',
        )}
      />

      <AnimatedPageHeader
        compact
        slides={[
          {
            imageUrl: LUXURY_HEADER_IMAGES.searchArchive,
            captionFr: 'Recherche transversale — Services, Réalisations & Conseils',
            captionEn: 'Cross-site Search — Services, Portfolio & Insights',
          },
        ]}
        breadcrumbs={[{ label: p('Recherche', 'Search') }]}
        kicker={p('Index officiel du groupe', 'Official Index')}
        title={p('Recherche sur le site CONCAM', 'Search CONCAM')}
        subtitle={p(
          'Explorez nos pôles de conseil, notre catalogue d’impression, nos références galerie et nos dossiers de presse.',
          'Explore our advisory pillars, printing catalogue, portfolio projects and editorial publications.',
        )}
      />

      <section className="relative bg-page py-12 overflow-x-clip">
        <ParallaxBackdropPlate variant="light-grid" offset={82} />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-8 relative z-10">
          <ParallaxLayer offset={30}>
            <RevealBlock>
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#931916] absolute left-4 top-1/2 -translate-y-1/2" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={p('Mot-clé : impression, manuels, marquage, signalétique...', 'Keyword: printing, manuals, branding, signage...')}
                    className="w-full pl-11 pr-4 py-3 text-sm bg-surface border border-hairline rounded-[4px] text-ink focus:border-[#931916] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-semibold bg-[#931916] hover:bg-[#A30013] text-white rounded-[4px] cursor-pointer transition-colors"
                >
                  {p('Rechercher', 'Search')}
                </button>
              </form>
            </RevealBlock>
          </ParallaxLayer>

        <div className="flex flex-wrap items-center gap-2 border-b border-hairline pb-4">
          {(
            [
              ['all', p(`Tous (${results.length})`, `All (${results.length})`)],
              ['service', p('Services', 'Services')],
              ['gallery', p('Galerie', 'Portfolio')],
              ['blog', p('Publications', 'Insights')],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilterType(key)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-[4px] border cursor-pointer transition-colors ${
                filterType === key
                  ? 'bg-[#110D0C] text-[#F6F2EA] border-[#110D0C]'
                  : 'bg-surface text-muted border-hairline hover:border-[#931916]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted">{p('Recherche en cours...', 'Searching...')}</p>
        ) : !searchParams.get('q') ? (
          <div className="bg-surface border border-hairline rounded-[4px] p-8 text-center text-sm text-muted">
            {p(
              'Saisissez un terme ci-dessus pour explorer les services, réalisations et publications de CONCAM.',
              'Enter a keyword above to search CONCAM services, portfolio and publications.',
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-hairline rounded-[4px] p-8 text-center space-y-3">
            <p className="text-sm text-muted">
              {p(
                `Aucun document publié ne correspond à « ${searchParams.get('q')} ».`,
                `No published document matches "${searchParams.get('q')}".`,
              )}
            </p>
            <Link
              to={p('/services', '/en/services')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#931916] hover:underline"
            >
              <span>{p('Parcourir nos 4 pôles métiers', 'Browse our 4 expertise pillars')}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((item, idx) => (
              <ParallaxColumnStagger key={`${item.type}-${item.id}`} index={idx} columns={2} amplitude={44}>
                <Link
                  to={item.href}
                  className="group bg-surface border border-hairline hover:border-[#931916] rounded-[4px] overflow-hidden flex flex-col h-full transition-all"
                >
                  {item.imageUrl && (
                    <div className="h-44 overflow-hidden bg-[#181413]">
                      <ParallaxImageFrame shiftPct={6.5}>
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </ParallaxImageFrame>
                    </div>
                  )}
                  <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <p className="text-[11px] uppercase tracking-[0.15em] font-semibold text-[#931916]">
                        {item.type === 'service'
                          ? p('Service', 'Service')
                          : item.type === 'gallery'
                          ? p('Réalisation', 'Portfolio')
                          : p('Article', 'Article')}{' '}
                        · <span className="text-muted">{item.subtitle}</span>
                      </p>
                      <ParallaxHorizontalTitle direction={idx % 2 === 0 ? -1 : 1} distance={16}>
                        <h2 className="font-serif text-xl font-bold text-ink group-hover:text-[#931916] transition-colors">
                          {item.title}
                        </h2>
                      </ParallaxHorizontalTitle>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">{item.excerpt}</p>
                    </div>
                    <div className="pt-3 flex items-center gap-1 text-xs font-semibold text-[#931916]">
                      <span>{p('Consulter', 'Read more')}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              </ParallaxColumnStagger>
            ))}
          </div>
        )}
        </div>
      </section>
    </>
  );
}
