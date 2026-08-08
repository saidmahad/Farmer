// pages/GrowthCalendar.tsx
// Group 4: GrowthCalendar.
//
// A 12-month strip showing the seasonal activities for each crop in the
// catalog. Layout:
//   - Crop filter chips at top.
//   - A horizontally-scrollable month strip with one row per crop, with
//     colored cells marking which months each phase (Land prep, Sowing,
//     Vegetative, Flowering/Fruiting, Harvest) runs in.
//
// The data is derived from each crop's catalog `season` string so adding
// new crops keeps the calendar working without a separate data file.
// Long-duration crops (Sugarcane) span multiple periods.

import { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, Sprout, Layers, Sun, Flower2, Wheat } from 'lucide-react';

import { apiFetch, ApiError } from '@/lib/api';
import { useLanguage } from '@/i18n/LanguageProvider';

interface CropLite {
  id: number;
  crop_name: string;
  season?: string | null;
  days_to_harvest?: string | null;
}

type Phase = 'landPrep' | 'sowing' | 'vegetative' | 'flowering' | 'harvest';
const PHASES: Phase[] = ['landPrep', 'sowing', 'vegetative', 'flowering', 'harvest'];

const PHASE_META: Record<Phase, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  landPrep:    { label: 'Land prep',     color: 'bg-harvest-yellow/30 text-harvest-yellow border-harvest-yellow/40', Icon: Layers },
  sowing:      { label: 'Sowing',        color: 'bg-info-blue/20 text-info-blue border-info-blue/30', Icon: Sprout },
  vegetative:  { label: 'Vegetative',    color: 'bg-primary-green/15 text-primary-green border-primary-green/30', Icon: Sun },
  flowering:   { label: 'Flowering',     color: 'bg-danger-red/15 text-danger-red border-danger-red/30', Icon: Flower2 },
  harvest:     { label: 'Harvest',       color: 'bg-harvest-yellow/40 text-harvest-yellow border-harvest-yellow/50', Icon: Wheat },
};

// Heuristic: turn the season string + days_to_harvest into a 12-month
// activity pattern. Returns a 12-long array of Phase[] (one entry per
// month Jan–Dec, each containing zero or more phases happening that
// month). The pattern is anchored to whichever month the season hints
// at — we err on a plausible sowing window for each crop.
function scheduleFor(crop: CropLite): Array<Phase[]> {
  const empty = (): Array<Phase[]> => Array.from({ length: 12 }, () => []);
  const all = empty();

  const name = crop.crop_name.toLowerCase();
  const season = (crop.season || '').toLowerCase();
  const daysText = crop.days_to_harvest || '';

  // Pick a sowing month based on season string and crop name.
  let sowingMonth: number | null = null;
  if (name.includes('rice')) sowingMonth = 5; // June
  else if (name.includes('wheat')) sowingMonth = 10; // November
  else if (name.includes('maize')) sowingMonth = 5;
  else if (name.includes('sugarcane')) sowingMonth = 1;
  else if (name.includes('tomato')) sowingMonth = 1;
  else if (name.includes('cotton')) sowingMonth = 4; // May
  else if (name.includes('onion')) sowingMonth = 9; // October
  else if (name.includes('groundnut')) sowingMonth = 5;
  else if (season.includes('kharif')) sowingMonth = 5;
  else if (season.includes('rabi')) sowingMonth = 10;
  else if (season.includes('year-round')) sowingMonth = 0;

  if (sowingMonth == null) return all;

  // Parse days-to-harvest (e.g. "120–150 days") — use the upper bound.
  const daysMatch = daysText.match(/(\d+)\s*[–-]\s*(\d+)/);
  const totalDays = daysMatch ? Math.min(365, Math.max(Number(daysMatch[2]), Number(daysMatch[1]))) : 120;

  // Walk the calendar relative to the sowing month.
  for (let d = 0; d < totalDays; d += 10) {
    const month = (sowingMonth + Math.floor(d / 30)) % 12;
    const ratio = d / totalDays;
    let phase: Phase;
    if (ratio < 0.05) phase = 'landPrep';
    else if (ratio < 0.15) phase = 'sowing';
    else if (ratio < 0.55) phase = 'vegetative';
    else if (ratio < 0.75) phase = 'flowering';
    else phase = 'harvest';
    if (!all[month].includes(phase)) all[month].push(phase);
  }

  // Always include at least a sowing cell at the sowing month.
  if (!all[sowingMonth].includes('sowing')) all[sowingMonth].push('sowing');

  return all;
}

const MONTH_LABELS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_LABELS_SO = ['Jaa', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Lul', 'Ogs', 'Seb', 'Okt', 'Noo', 'Dis'];
const MONTH_LABELS_AR = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];

export function GrowthCalendar() {
  const { t, locale } = useLanguage();
  const [crops, setCrops] = useState<CropLite[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ crops: CropLite[] }>('/api/crops')
      .then((res) => {
        if (!cancelled) setCrops(res.crops);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('calendarGenericError'));
      });
    return () => { cancelled = true; };
  }, [t]);

  const monthLabels = useMemo(() => {
    if (locale === 'so') return MONTH_LABELS_SO;
    if (locale === 'ar') return MONTH_LABELS_AR;
    return MONTH_LABELS_EN;
  }, [locale]);

  const visible = useMemo(() => {
    if (!crops) return [];
    if (activeFilter === 'all') return crops;
    return crops.filter((c) => c.crop_name.toLowerCase().includes(activeFilter.toLowerCase()));
  }, [crops, activeFilter]);

  const cropFilters = useMemo(() => {
    if (!crops) return [{ id: 'all', label: t('calendarFilterAll') }];
    const items = [{ id: 'all', label: t('calendarFilterAll') }];
    for (const c of crops) {
      const k = c.crop_name.toLowerCase().split(' ')[0]; // "Rice (Paddy)" → "rice"
      items.push({ id: k, label: c.crop_name.replace(/\s*\(.*?\)\s*/g, '') });
    }
    return items;
  }, [crops, t]);

  // Highlight the current month column.
  const currentMonth = new Date().getMonth();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('calendarTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('calendarSubtitle')}</p>
      </header>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        {cropFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className={[
              'px-3 h-8 rounded-full border text-sm transition-all',
              activeFilter === f.id
                ? 'border-primary-green bg-primary-green/10 text-primary-green font-medium'
                : 'border-border text-foreground hover:border-primary-green/50',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="bg-white border border-border rounded-xl p-4">
        <div className="flex flex-wrap gap-2">
          {PHASES.map((p) => {
            const m = PHASE_META[p];
            const Icon = m.Icon;
            return (
              <span
                key={p}
                className={['inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border', m.color].join(' ')}
              >
                <Icon className="w-3 h-3" />
                {m.label}
              </span>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-danger-red/10 border border-danger-red/30 text-danger-red text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Calendar grid */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[820px]">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="text-start px-4 py-3 text-muted-foreground font-medium sticky start-0 bg-secondary min-w-44">
                  <CalendarIcon className="w-4 h-4 inline-block me-2 rtl:ms-2" />
                  {t('calendarCropColumn')}
                </th>
                {monthLabels.map((m, i) => (
                  <th
                    key={i}
                    className={[
                      'px-2 py-3 text-center font-medium min-w-14',
                      i === currentMonth ? 'bg-primary-green/10 text-primary-green' : 'text-muted-foreground',
                    ].join(' ')}
                  >
                    {m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!crops && (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center text-sm text-muted-foreground">
                    {t('calendarLoading')}
                  </td>
                </tr>
              )}
              {crops && visible.map((c) => {
                const phases = scheduleFor(c);
                return (
                  <tr key={c.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 font-medium text-foreground sticky start-0 bg-white">
                      {c.crop_name}
                    </td>
                    {phases.map((monthPhases, i) => (
                      <td
                        key={i}
                        className={[
                          'px-1 py-2 text-center align-middle',
                          i === currentMonth ? 'bg-primary-green/5' : '',
                        ].join(' ')}
                      >
                        <div className="flex items-center justify-center gap-0.5 flex-wrap">
                          {monthPhases.map((p) => {
                            const Icon = PHASE_META[p].Icon;
                            return (
                              <span
                                key={p}
                                title={PHASE_META[p].label}
                                className={['w-6 h-6 inline-flex items-center justify-center rounded border', PHASE_META[p].color].join(' ')}
                              >
                                <Icon className="w-3 h-3" />
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help line */}
      <p className="text-xs text-muted-foreground leading-relaxed">
        {t('calendarFootnote')}
      </p>
    </div>
  );
}