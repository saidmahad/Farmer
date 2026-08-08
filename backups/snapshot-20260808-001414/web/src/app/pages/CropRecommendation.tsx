// pages/CropRecommendation.tsx
// Group 3: list + detail view.
//
// Two modes, controlled by URL search params:
//   - ?crop=<id>  → detail view (shows crop facts + advice + ask button)
//   - otherwise    → grid view (search + category filter)
//
// Behaviour:
//   - On first mount, fetches GET /api/crops once and caches the list.
//   - On entering detail (or pressing "Get advice"), calls
//     GET /api/advice?crop_id=<id> which returns { text, source }
//     where source is 'ai' (Claude) or 'template' (catalog-derived).
//   - When a detail view successfully loads, the crop id is pushed onto
//     farmerai.recentCrops in localStorage so the Dashboard's
//     "Recent advice" list picks it up.

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Search,
  Sprout,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Clock,
  Droplets,
  Layers,
  Bug,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CropSummary {
  id: number;
  crop_name: string;
  local_name?: string | null;
  season?: string | null;
}

interface CropDetails extends CropSummary {
  planting_method: string;
  irrigation: string;
  fertilizer: string;
  common_pests?: string | null;
  days_to_harvest?: string | null;
}

interface AdviceResponse {
  crop: CropSummary;
  advice: string;
  source: 'ai' | 'template';
  fields: {
    planting_method: string;
    irrigation: string;
    fertilizer: string;
    common_pests?: string | null;
    days_to_harvest?: string | null;
  };
}

type Filter = 'all' | 'cereals' | 'vegetables' | 'cash' | 'oilseeds';

// Static category hints — we infer the category from the crop name
// because the legacy crops table doesn't carry one. The catalog is
// small (8 rows) so this is more reliable than guessing from text.
const CATEGORY: Record<string, Filter> = {
  'rice (paddy)': 'cereals',
  wheat: 'cereals',
  'maize (corn)': 'cereals',
  sugarcane: 'cash',
  tomato: 'vegetables',
  cotton: 'cash',
  onion: 'vegetables',
  groundnut: 'oilseeds',
};

const RECENT_KEY = 'farmerai.recentCrops';
const RECENT_LIMIT = 5;

function categoryOf(name: string): Filter {
  return CATEGORY[name.trim().toLowerCase()] ?? 'all';
}

function pushRecent(c: CropSummary) {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const prev: Array<{ id: number; crop_name: string; local_name?: string | null; season?: string | null; at: number }> =
      raw ? JSON.parse(raw) : [];
    const filtered = prev.filter((p) => p.id !== c.id);
    filtered.unshift({ ...c, at: Date.now() });
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, RECENT_LIMIT)));
  } catch {
    // ignore — localStorage may be unavailable
  }
}

export function CropRecommendation() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const cropIdParam = params.get('crop');
  const cropId = cropIdParam ? Number(cropIdParam) : null;
  const isDetail = Number.isInteger(cropId) && cropId! > 0;

  // ---------- data ----------
  const [crops, setCrops] = useState<CropSummary[] | null>(null);
  const [details, setDetails] = useState<CropDetails | null>(null);
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [loadingCrops, setLoadingCrops] = useState(true);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // ---------- initial list fetch ----------
  useEffect(() => {
    let cancelled = false;
    setLoadingCrops(true);
    apiFetch<{ crops: CropSummary[] }>('/api/crops')
      .then((res) => {
        if (!cancelled) setCrops(res.crops);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof ApiError ? err.message : t('cropAdviceError'));
      })
      .finally(() => {
        if (!cancelled) setLoadingCrops(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  // ---------- detail fetch ----------
  const loadAdvice = useCallback(
    async (id: number) => {
      setLoadingAdvice(true);
      setAdviceError(null);
      try {
        const [d, a] = await Promise.all([
          apiFetch<{ crop: CropDetails }>(`/api/crops/${id}`),
          apiFetch<AdviceResponse>(`/api/advice?crop_id=${id}`),
        ]);
        setDetails(d.crop);
        setAdvice(a);
        pushRecent(d.crop);
      } catch (err) {
        setAdviceError(err instanceof ApiError ? err.message : t('cropAdviceError'));
        setDetails(null);
        setAdvice(null);
      } finally {
        setLoadingAdvice(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (!isDetail) {
      setDetails(null);
      setAdvice(null);
      return;
    }
    loadAdvice(cropId as number);
  }, [isDetail, cropId, loadAdvice]);

  // ---------- list filtering ----------
  const filtered = useMemo(() => {
    if (!crops) return [];
    const q = search.trim().toLowerCase();
    return crops.filter((c) => {
      if (filter !== 'all' && categoryOf(c.crop_name) !== filter) return false;
      if (!q) return true;
      return (
        c.crop_name.toLowerCase().includes(q) ||
        (c.local_name || '').toLowerCase().includes(q) ||
        (c.season || '').toLowerCase().includes(q)
      );
    });
  }, [crops, search, filter]);

  // ---------- view dispatch ----------
  if (isDetail) {
    return (
      <DetailView
        t={t}
        cropId={cropId as number}
        details={details}
        advice={advice}
        loading={loadingAdvice}
        error={adviceError}
        onRefresh={() => loadAdvice(cropId as number)}
        onBack={() => {
          setParams({});
          navigate('/crop-recommendation', { replace: true });
        }}
      />
    );
  }

  return (
    <ListView
      t={t}
      crops={crops}
      loading={loadingCrops}
      filtered={filtered}
      search={search}
      setSearch={setSearch}
      filter={filter}
      setFilter={setFilter}
      onPick={(c) => {
        setParams({ crop: String(c.id) });
        navigate(`/crop-recommendation?crop=${c.id}`, { replace: false });
      }}
    />
  );
}

// -------------------- ListView --------------------

function ListView({
  t,
  crops,
  loading,
  filtered,
  search,
  setSearch,
  filter,
  setFilter,
  onPick,
}: {
  t: (k: string) => string;
  crops: CropSummary[] | null;
  loading: boolean;
  filtered: CropSummary[];
  search: string;
  setSearch: (v: string) => void;
  filter: Filter;
  setFilter: (v: Filter) => void;
  onPick: (c: CropSummary) => void;
}) {
  const FILTERS: { id: Filter; labelKey: string }[] = [
    { id: 'all', labelKey: 'cropFilterAll' },
    { id: 'cereals', labelKey: 'cropFilterCereals' },
    { id: 'vegetables', labelKey: 'cropFilterVegetables' },
    { id: 'cash', labelKey: 'cropFilterCash' },
    { id: 'oilseeds', labelKey: 'cropFilterOilseeds' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('cropTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('cropSubtitle')}</p>
      </header>

      <div className="bg-white rounded-xl border border-border p-4 space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('cropSearchPlaceholder')}
            className="ps-9 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={[
                  'px-3 h-8 rounded-full border text-sm transition-all',
                  active
                    ? 'border-primary-green bg-primary-green/10 text-primary-green font-medium'
                    : 'border-border text-foreground hover:border-primary-green/50',
                ].join(' ')}
              >
                {t(f.labelKey)}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState t={t} />
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c) => (
            <CropCard key={c.id} crop={c} onPick={onPick} t={t} />
          ))}
        </ul>
      )}

      {crops && (
        <p className="text-xs text-muted-foreground text-center pt-2">
          {filtered.length}/{crops.length}
        </p>
      )}
    </div>
  );
}

function CropCard({
  crop,
  onPick,
  t,
}: {
  crop: CropSummary;
  onPick: (c: CropSummary) => void;
  t: (k: string) => string;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(crop)}
        className="group w-full text-start bg-white border border-border rounded-xl p-5 hover:border-primary-green hover:shadow-sm transition-all"
      >
        <div className="w-12 h-12 rounded-lg bg-primary-green/10 text-primary-green flex items-center justify-center mb-4">
          <Sprout className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-foreground leading-tight">{crop.crop_name}</h3>
        {crop.local_name && crop.local_name !== crop.crop_name && (
          <p className="text-xs text-muted-foreground mt-0.5">{crop.local_name}</p>
        )}
        {crop.season && (
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">
            {crop.season}
          </p>
        )}
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary-green">
          {t('cropGetAdvice')}
          <ArrowRight className="w-3 h-3 rtl:rotate-180" />
        </span>
      </button>
    </li>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i} className="bg-white border border-border rounded-xl p-5 animate-pulse">
          <div className="w-12 h-12 rounded-lg bg-secondary mb-4" />
          <div className="h-4 w-2/3 bg-secondary rounded mb-2" />
          <div className="h-3 w-1/3 bg-secondary rounded mb-4" />
          <div className="h-3 w-full bg-secondary rounded" />
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ t }: { t: (k: string) => string }) {
  return (
    <div className="bg-white border border-dashed border-border rounded-xl p-10 text-center">
      <div className="w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mx-auto mb-3">
        <Search className="w-5 h-5" />
      </div>
      <h3 className="font-medium text-foreground">{t('cropEmptyTitle')}</h3>
      <p className="text-sm text-muted-foreground mt-1">{t('cropEmptyBody')}</p>
    </div>
  );
}

// -------------------- DetailView --------------------

function DetailView({
  t,
  cropId,
  details,
  advice,
  loading,
  error,
  onRefresh,
  onBack,
}: {
  t: (k: string) => string;
  cropId: number;
  details: CropDetails | null;
  advice: AdviceResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
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
        {t('cropBackToList')}
      </button>

      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-1">
            <Sprout className="w-3.5 h-3.5 text-primary-green" />
            {cropId}
          </div>
          <h1 className="text-2xl font-semibold text-foreground leading-tight">
            {details?.crop_name || advice?.crop.crop_name || '...'}
          </h1>
          {details?.local_name && details.local_name !== details.crop_name && (
            <p className="text-sm text-muted-foreground">{details.local_name}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {t('cropAdviceRefresh')}
          </Button>
        </div>
      </header>

      {/* Facts grid */}
      {details && (
        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FactCard
            icon={<Calendar className="w-4 h-4" />}
            label={t('cropSeason')}
            value={details.season || '—'}
          />
          <FactCard
            icon={<Clock className="w-4 h-4" />}
            label={t('cropDaysToHarvest')}
            value={details.days_to_harvest || '—'}
          />
          <FactCard
            icon={<Layers className="w-4 h-4" />}
            label={t('cropPlantingMethod')}
            value={details.planting_method}
            fullWidth
          />
          <FactCard
            icon={<Droplets className="w-4 h-4" />}
            label={t('cropIrrigation')}
            value={details.irrigation}
            fullWidth
          />
          <FactCard
            icon={<Sparkles className="w-4 h-4" />}
            label={t('cropFertilizer')}
            value={details.fertilizer}
            fullWidth
          />
          {details.common_pests && (
            <FactCard
              icon={<Bug className="w-4 h-4" />}
              label={t('cropCommonPests')}
              value={details.common_pests}
              fullWidth
            />
          )}
        </section>
      )}

      {/* Advice card */}
      <section className="bg-white border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('cropAdviceTitle')}</h2>
          {advice && (
            <span
              className={[
                'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border',
                advice.source === 'ai'
                  ? 'bg-primary-green/10 text-primary-green border-primary-green/30'
                  : 'bg-harvest-yellow/20 text-harvest-yellow border-harvest-yellow/40',
              ].join(' ')}
            >
              {advice.source === 'ai' ? (
                <Sparkles className="w-3 h-3" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              {advice.source === 'ai' ? t('cropAdviceAiBadge') : t('cropAdviceTemplateBadge')}
            </span>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('cropAdviceLoading')}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-md bg-danger-red/10 border border-danger-red/30 text-danger-red text-sm px-3 py-2">
            {error}
          </div>
        )}

        {!loading && !error && advice && (
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {advice.advice}
          </p>
        )}
      </section>
    </div>
  );
}

function FactCard({
  icon,
  label,
  value,
  fullWidth,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={['bg-white border border-border rounded-xl p-4', fullWidth ? 'sm:col-span-2 lg:col-span-3' : ''].join(' ')}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-2">
        <span className="text-primary-green">{icon}</span>
        {label}
      </div>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  );
}