// pages/PlantExplorer.tsx
// Group 4: PlantExplorer.
//
// Two views, controlled by URL (?plant=<slug>):
//   - Grid view (default): all 8 plants, search + category filter chips,
//     click → detail.
//   - Detail view: hero image, key facts (category, season, water, climate,
//     region, duration, yield, difficulty, profitability, market price),
//     plus 4 panels — Overview / Agronomy / Pests / Resources — sourced
//     from /api/plants/:slug.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Search,
  ArrowLeft,
  Loader2,
  Sprout,
  Clock,
  TrendingUp,
  Globe,
  Cloud,
  Layers,
  Banknote,
  Activity,
  Bug,
  PlayCircle,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageProvider';

interface Pest { name: string; severity: string; treatment: string }
interface Resource { title: string; type: string; duration?: string }
interface Overview {
  family?: string; lifecycle?: string; planting_depth?: string;
  spacing?: string; soil_type?: string; ph_range?: string;
}
interface Agronomy {
  land_prep?: string; seed_rate?: string; fertilizer?: string;
  irrigation?: string; intercropping?: string;
}

interface Plant {
  id: number;
  slug: string;
  name: string;
  scientific_name?: string | null;
  category?: string | null;
  season?: string | null;
  water_need?: string | null;
  climate?: string | null;
  region?: string | null;
  duration?: string | null;
  expected_yield?: string | null;
  difficulty?: string | null;
  profitability?: string | null;
  market_price?: string | null;
  image_url?: string | null;
  description?: string | null;
  overview?: Overview;
  agronomy?: Agronomy;
  pests?: Pest[];
  resources?: Resource[];
}

export function PlantExplorer() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const slugParam = params.get('plant');
  const isDetail = Boolean(slugParam);

  const [plants, setPlants] = useState<Plant[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // ----- fetch catalog -----
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<{ plants: Plant[] }>('/api/plants')
      .then((res) => {
        if (!cancelled) setPlants(res.plants);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('plantsGenericError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  // ----- detail fetch -----
  const [detail, setDetail] = useState<Plant | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  useEffect(() => {
    if (!isDetail) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    apiFetch<{ plant: Plant }>(`/api/plants/${slugParam}`)
      .then((res) => {
        if (!cancelled) setDetail(res.plant);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof ApiError ? err.message : t('plantsGenericError'));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isDetail, slugParam, t]);

  // ----- filter categories -----
  const categories = useMemo(() => {
    if (!plants) return ['all'];
    const set = new Set<string>(['all']);
    plants.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [plants]);

  const filtered = useMemo(() => {
    if (!plants) return [];
    const tokens = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return plants.filter((p) => {
      if (filter !== 'all' && p.category !== filter) return false;
      if (!tokens.length) return true;
      // Short identifier fields (name, scientific name, category) match by
      // substring. The description matches on whole words only, so typing
      // "rice" does not surface every crop whose blurb mentions "prices".
      const haystack = `${p.name} ${p.scientific_name || ''} ${p.category || ''}`.toLowerCase();
      const desc = (p.description || '').toLowerCase();
      return tokens.every((tok) => {
        if (haystack.includes(tok)) return true;
        const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|[^a-z0-9])${esc}(?![a-z0-9])`, 'i').test(desc);
      });
    });
  }, [plants, search, filter]);

  // ----- detail view -----
  if (isDetail) {
    return (
      <DetailView
        t={t}
        slug={slugParam as string}
        plant={detail}
        loading={detailLoading}
        onBack={() => {
          setParams({});
          navigate('/plant-explorer', { replace: true });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('plantsTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('plantsSubtitle')}</p>
      </header>

      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('plantsSearchPlaceholder')}
            className="ps-9 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const active = filter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={[
                  'px-3 h-8 rounded-full border text-sm capitalize transition-all',
                  active
                    ? 'border-primary-green bg-primary-green/10 text-primary-green font-medium'
                    : 'border-border text-foreground hover:border-primary-green/50',
                ].join(' ')}
              >
                {c === 'all' ? t('plantsFilterAll') : c}
              </button>
            );
          })}
        </div>
      </div>

      {!loading && !error && (
        <p className="text-xs text-muted-foreground">
          {filtered.length} / {plants?.length || 0} {t('plantsResultCount')}
        </p>
      )}

      {error && (
        <div className="bg-danger-red/10 border border-danger-red/30 text-danger-red text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <PlantCard
              key={p.slug}
              plant={p}
              onPick={(s) => {
                setParams({ plant: s });
                navigate(`/plant-explorer?plant=${s}`);
              }}
              t={t}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------- PlantCard ----------------------

function PlantCard({
  plant,
  onPick,
  t: _t,
}: {
  plant: Plant;
  onPick: (slug: string) => void;
  t: (k: string) => string;
}) {
  void _t;
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(plant.slug)}
        className="group w-full text-start bg-white border border-border rounded-xl overflow-hidden hover:border-primary-green hover:shadow-sm transition-all"
      >
        {plant.image_url ? (
          <img
            src={plant.image_url}
            alt={plant.name}
            loading="lazy"
            className="w-full h-32 object-cover bg-secondary"
          />
        ) : (
          <div className="w-full h-32 bg-secondary flex items-center justify-center">
            <Sprout className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-foreground leading-tight">{plant.name}</h3>
          {plant.scientific_name && (
            <p className="text-xs italic text-muted-foreground mt-0.5">{plant.scientific_name}</p>
          )}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {plant.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-green/10 text-primary-green">
                {plant.category}
              </span>
            )}
            {plant.profitability && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-harvest-yellow/20 text-harvest-yellow">
                {plant.profitability}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
            {plant.description}
          </p>
        </div>
      </button>
    </li>
  );
}

// ---------------------- DetailView ----------------------

function DetailView({
  t,
  plant,
  loading,
  onBack,
}: {
  t: (k: string) => string;
  slug: string;
  plant: Plant | null;
  loading: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
        {t('plantsBackToList')}
      </button>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('plantsLoading')}
        </div>
      )}

      {!loading && plant && (
        <>
          <header className="bg-white border border-border rounded-xl overflow-hidden">
            {plant.image_url && (
              <img src={plant.image_url} alt={plant.name} className="w-full h-56 object-cover" />
            )}
            <div className="p-6">
              <h1 className="text-2xl font-semibold text-foreground leading-tight">{plant.name}</h1>
              {plant.scientific_name && (
                <p className="text-sm italic text-muted-foreground mt-1">{plant.scientific_name}</p>
              )}
              {plant.description && (
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{plant.description}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {plant.category && <Pill className="bg-primary-green/10 text-primary-green">{plant.category}</Pill>}
                {plant.season && <Pill className="bg-info-blue/10 text-info-blue">{plant.season}</Pill>}
                {plant.profitability && <Pill className="bg-harvest-yellow/20 text-harvest-yellow">{plant.profitability}</Pill>}
              </div>
            </div>
          </header>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <FactCard icon={<Clock className="w-4 h-4" />} label={t('plantsDuration')} value={plant.duration} />
            <FactCard icon={<TrendingUp className="w-4 h-4" />} label={t('plantsYield')} value={plant.expected_yield} />
            <FactCard icon={<Layers className="w-4 h-4" />} label={t('plantsDifficulty')} value={plant.difficulty} />
            <FactCard icon={<Banknote className="w-4 h-4" />} label={t('plantsMarket')} value={plant.market_price} />
            <FactCard icon={<Activity className="w-4 h-4" />} label={t('plantsWaterNeed')} value={plant.water_need} />
            <FactCard icon={<Cloud className="w-4 h-4" />} label={t('plantsClimate')} value={plant.climate} />
            <FactCard icon={<Globe className="w-4 h-4" />} label={t('plantsRegion')} value={plant.region} />
            <FactCard icon={<Sprout className="w-4 h-4" />} label={t('plantsSeasonShort')} value={plant.season} />
          </section>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={t('plantsOverview')} icon={<BookOpen className="w-4 h-4" />}>
              <Dl items={Object.entries(plant.overview || {})
                .filter(([, v]) => v !== undefined && v !== null && v !== '')} />
            </Panel>
            <Panel title={t('plantsAgronomy')} icon={<Layers className="w-4 h-4" />}>
              <Dl items={Object.entries(plant.agronomy || {})
                .filter(([, v]) => v !== undefined && v !== null && v !== '')} />
            </Panel>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <Panel title={t('plantsPests')} icon={<Bug className="w-4 h-4" />}>
              {plant.pests && plant.pests.length > 0 ? (
                <ul className="space-y-3">
                  {plant.pests.map((p) => (
                    <li key={p.name} className="border border-border rounded-md p-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground text-sm">{p.name}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                          {p.severity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.treatment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t('plantsEmpty')}</p>
              )}
            </Panel>
            <Panel title={t('plantsResources')} icon={<PlayCircle className="w-4 h-4" />}>
              {plant.resources && plant.resources.length > 0 ? (
                <ul className="space-y-2">
                  {plant.resources.map((r) => (
                    <li key={r.title} className="flex items-center justify-between border border-border rounded-md p-3">
                      <div>
                        <p className="font-medium text-foreground text-sm">{r.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{r.type}</p>
                      </div>
                      {r.duration && (
                        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {r.duration}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">{t('plantsEmpty')}</p>
              )}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------- shared atoms ----------------------

function Pill({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={['text-xs px-2 py-0.5 rounded-full', className].filter(Boolean).join(' ')}>
      {children}
    </span>
  );
}

function FactCard({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string | null }) {
  return (
    <div className="bg-white border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
        <span className="text-primary-green">{icon}</span>
        {label}
      </div>
      <p className="text-sm text-foreground leading-relaxed">{value || '—'}</p>
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary-green">{icon}</span>
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Dl({ items }: { items: Array<[string, unknown]> }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <dl className="space-y-2">
      {items.map(([k, v]) => (
        <div key={k} className="flex items-start gap-3 text-sm">
          <dt className="text-muted-foreground capitalize min-w-28 shrink-0">
            {k.replace(/_/g, ' ')}
          </dt>
          <dd className="text-foreground leading-relaxed">{String(v)}</dd>
        </div>
      ))}
    </dl>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="bg-white border border-border rounded-xl overflow-hidden animate-pulse">
          <div className="w-full h-32 bg-secondary" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-2/3 bg-secondary rounded" />
            <div className="h-3 w-1/2 bg-secondary rounded" />
            <div className="h-3 w-full bg-secondary rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}