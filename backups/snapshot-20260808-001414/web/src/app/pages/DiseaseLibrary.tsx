// pages/DiseaseLibrary.tsx
// Group 4: DiseaseLibrary.
//
// Two views, controlled by URL (?disease=<slug>):
//   - Grid: search + category chips, all diseases as cards.
//   - Detail: hero image, name + meta, three panels (symptoms, treatment,
//     prevention). Severity badge color-coded.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  Search,
  ArrowLeft,
  Loader2,
  Bug,
  ShieldAlert,
  ShieldCheck,
  Sprout,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageProvider';

interface Disease {
  id: number;
  slug: string;
  name: string;
  crop_slug?: string | null;
  category?: string | null;
  severity?: string | null;
  symptoms?: string | null;
  treatment?: string | null;
  prevention?: string | null;
  image_url?: string | null;
}

const CROP_LABELS: Record<string, string> = {
  rice: 'Rice', wheat: 'Wheat', tomato: 'Tomato', cotton: 'Cotton',
  maize: 'Maize', groundnut: 'Groundnut', onion: 'Onion', sugarcane: 'Sugarcane',
};

function severityClass(sev?: string | null) {
  switch ((sev || '').toLowerCase()) {
    case 'high': return 'bg-danger-red/10 text-danger-red border-danger-red/30';
    case 'medium': return 'bg-harvest-yellow/20 text-harvest-yellow border-harvest-yellow/40';
    case 'low': return 'bg-primary-green/10 text-primary-green border-primary-green/30';
    default: return 'bg-secondary text-muted-foreground border-border';
  }
}

export function DiseaseLibrary() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const slugParam = params.get('disease');
  const isDetail = Boolean(slugParam);

  const [list, setList] = useState<Disease[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  // ----- fetch list -----
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<{ diseases: Disease[] }>('/api/diseases')
      .then((res) => {
        if (!cancelled) setList(res.diseases);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('diseaseGenericError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [t]);

  // ----- detail fetch -----
  const [detail, setDetail] = useState<Disease | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  useEffect(() => {
    if (!isDetail) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    apiFetch<{ disease: Disease }>(`/api/diseases/${slugParam}`)
      .then((res) => {
        if (!cancelled) setDetail(res.disease);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof ApiError ? err.message : t('diseaseGenericError'));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => { cancelled = true; };
  }, [isDetail, slugParam, t]);

  // ----- filter chips -----
  const categories = useMemo(() => {
    if (!list) return ['all'];
    const set = new Set<string>(['all']);
    list.forEach((d) => d.category && set.add(d.category));
    return Array.from(set);
  }, [list]);

  const filtered = useMemo(() => {
    if (!list) return [];
    const q = search.trim().toLowerCase();
    return list.filter((d) => {
      if (filter !== 'all' && d.category !== filter) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        (d.crop_slug && CROP_LABELS[d.crop_slug]?.toLowerCase().includes(q)) ||
        (d.symptoms || '').toLowerCase().includes(q)
      );
    });
  }, [list, search, filter]);

  if (isDetail) {
    return (
      <DetailView
        t={t}
        slug={slugParam as string}
        disease={detail}
        loading={detailLoading}
        onBack={() => {
          setParams({});
          navigate('/disease-library', { replace: true });
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('diseaseTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('diseaseSubtitle')}</p>
      </header>

      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('diseaseSearchPlaceholder')}
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
                  'px-3 h-8 rounded-full border text-sm transition-all',
                  active
                    ? 'border-primary-green bg-primary-green/10 text-primary-green font-medium'
                    : 'border-border text-foreground hover:border-primary-green/50',
                ].join(' ')}
              >
                {c === 'all' ? t('diseaseFilterAll') : c}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-danger-red/10 border border-danger-red/30 text-danger-red text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonGrid />
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((d) => (
            <DiseaseCard
              key={d.slug}
              disease={d}
              onPick={(s) => {
                setParams({ disease: s });
                navigate(`/disease-library?disease=${s}`);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------- DiseaseCard ----------------------

function DiseaseCard({
  disease,
  onPick,
}: {
  disease: Disease;
  onPick: (slug: string) => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onPick(disease.slug)}
        className="group w-full text-start bg-white border border-border rounded-xl overflow-hidden hover:border-danger-red/50 hover:shadow-sm transition-all"
      >
        {disease.image_url ? (
          <img
            src={disease.image_url}
            alt={disease.name}
            loading="lazy"
            className="w-full h-32 object-cover bg-secondary"
          />
        ) : (
          <div className="w-full h-32 bg-danger-red/10 flex items-center justify-center">
            <Bug className="w-8 h-8 text-danger-red" />
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-foreground leading-tight">{disease.name}</h3>
          {disease.crop_slug && (
            <p className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
              <Sprout className="w-3 h-3" />
              {CROP_LABELS[disease.crop_slug] || disease.crop_slug}
            </p>
          )}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {disease.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {disease.category}
              </span>
            )}
            {disease.severity && (
              <span className={['text-xs px-2 py-0.5 rounded-full border', severityClass(disease.severity)].join(' ')}>
                {disease.severity}
              </span>
            )}
          </div>
          {disease.symptoms && (
            <p className="text-xs text-muted-foreground mt-3 line-clamp-2 leading-relaxed">
              {disease.symptoms}
            </p>
          )}
        </div>
      </button>
    </li>
  );
}

// ---------------------- DetailView ----------------------

function DetailView({
  t,
  disease,
  loading,
  onBack,
}: {
  t: (k: string) => string;
  slug: string;
  disease: Disease | null;
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
        {t('diseaseBackToList')}
      </button>

      {loading && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('diseaseLoading')}
        </div>
      )}

      {!loading && disease && (
        <>
          <header className="bg-white border border-border rounded-xl overflow-hidden">
            {disease.image_url && (
              <img src={disease.image_url} alt={disease.name} className="w-full h-56 object-cover" />
            )}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-semibold text-foreground leading-tight">
                  {disease.name}
                </h1>
                {disease.severity && (
                  <span className={['text-xs px-2 py-1 rounded-full border', severityClass(disease.severity)].join(' ')}>
                    {disease.severity}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                {disease.crop_slug && (
                  <span className="inline-flex items-center gap-1">
                    <Sprout className="w-3.5 h-3.5" />
                    {CROP_LABELS[disease.crop_slug] || disease.crop_slug}
                  </span>
                )}
                {disease.category && (
                  <span className="inline-flex items-center gap-1">
                    <Bug className="w-3.5 h-3.5" />
                    {disease.category}
                  </span>
                )}
              </div>
            </div>
          </header>

          <div className="grid lg:grid-cols-3 gap-4">
            <Panel title={t('diseaseSymptoms')} icon={<Bug className="w-4 h-4 text-danger-red" />}>
              {disease.symptoms || '—'}
            </Panel>
            <Panel title={t('diseaseTreatment')} icon={<ShieldAlert className="w-4 h-4 text-harvest-yellow" />}>
              {disease.treatment || '—'}
            </Panel>
            <Panel title={t('diseasePrevention')} icon={<ShieldCheck className="w-4 h-4 text-primary-green" />}>
              {disease.prevention || '—'}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="font-semibold text-foreground">{title}</h2>
      </div>
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{children}</p>
    </section>
  );
}

function SkeletonGrid() {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="bg-white border border-border rounded-xl overflow-hidden animate-pulse">
          <div className="w-full h-32 bg-secondary" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-2/3 bg-secondary rounded" />
            <div className="h-3 w-1/3 bg-secondary rounded" />
            <div className="h-3 w-full bg-secondary rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}