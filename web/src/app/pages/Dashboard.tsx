// pages/Dashboard.tsx
// Group 3: Figma-style farmer dashboard.
//
// Sections, in order:
//   1. Greeting line with the signed-in user's first name.
//   2. Weather widget (mock — deterministic so re-renders are stable).
//   3. Four stat tiles (Crops catalog, Land tracked, Languages, Soil).
//   4. Recent advice list (pulls from localStorage; falls back to empty).
//   5. Four quick-action shortcuts.
//   6. Tip of the day card.
//
// Reads the user's profile from AuthContext and pulls the most-recent
// advice slugs from localStorage so returning farmers land on a
// personalised home screen.

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  Sun,
  Cloud,
  Wind,
  Droplets,
  CloudRain,
  Wheat,
  Ruler,
  Languages,
  FlaskConical,
  Bug,
  MessageCircle,
  Sparkles,
  Sprout,
  ArrowRight,
} from 'lucide-react';

import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/i18n/LanguageProvider';
import { Button } from '@/components/ui/button';

interface RecentCrop {
  id: number;
  crop_name: string;
  local_name?: string | null;
  season?: string | null;
  at: number; // epoch ms
}

const RECENT_KEY = 'farmerai.recentCrops';
const RECENT_LIMIT = 5;

function useRecentCrops(): RecentCrop[] {
  const [items, setItems] = useState<RecentCrop[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setItems(parsed.slice(0, RECENT_LIMIT));
    } catch {
      // localStorage might be disabled — fall back to empty silently.
    }
  }, []);

  return items;
}

function firstName(full: string | undefined | null): string {
  if (!full) return 'farmer';
  return full.trim().split(/\s+/)[0] || 'farmer';
}

function greetingKey(hour: number, t: (k: string) => string): string {
  if (hour < 12) return t('dashGreetingMorning');
  if (hour < 18) return t('dashGreetingAfternoon');
  return t('dashGreetingEvening');
}

// Deterministic "weather" — pulls from the current hour so the widget
// looks reasonable without any external API.
function mockWeather(): { tempC: number; humidity: number; windKph: number; rainPct: number; icon: 'sun' | 'cloud' | 'rain' } {
  const h = new Date().getHours();
  if (h < 7 || h >= 19) return { tempC: 18, humidity: 72, windKph: 8, rainPct: 12, icon: 'cloud' };
  if (h < 14) return { tempC: 28, humidity: 55, windKph: 11, rainPct: 5, icon: 'sun' };
  return { tempC: 24, humidity: 64, windKph: 14, rainPct: 30, icon: 'rain' };
}

function WeatherIcon({ kind }: { kind: 'sun' | 'cloud' | 'rain' }) {
  if (kind === 'sun') return <Sun className="w-10 h-10 text-harvest-yellow" />;
  if (kind === 'cloud') return <Cloud className="w-10 h-10 text-info-blue" />;
  return <CloudRain className="w-10 h-10 text-info-blue" />;
}

export function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const recents = useRecentCrops();
  const weather = useMemo(() => mockWeather(), []);
  const greeting = useMemo(() => greetingKey(new Date().getHours(), t), [t]);

  const land = user?.land_size;

  return (
    <div className="space-y-6">
      {/* -------- Greeting + weather row ──────── */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6 flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary-green/10 text-primary-green flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground leading-tight">
              {greeting}, {firstName(user?.name)}.
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{t('dashSubtitle')}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">{t('dashWeatherTitle')}</p>
            <WeatherIcon kind={weather.icon} />
          </div>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-semibold text-foreground leading-none">
              {weather.tempC}°
            </span>
            <span className="text-xs text-muted-foreground pb-1">C</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {t('dashWeatherBody')}
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Droplets className="w-3.5 h-3.5" />
              {weather.humidity}%
              <span className="block text-[10px]">{t('dashWeatherHumidity')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wind className="w-3.5 h-3.5" />
              {weather.windKph}
              <span className="block text-[10px]">{t('dashWeatherWind')}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <CloudRain className="w-3.5 h-3.5" />
              {weather.rainPct}%
              <span className="block text-[10px]">{t('dashWeatherRain')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* -------- Stats row ──────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Wheat className="w-5 h-5" />}
          accent="bg-primary-green/10 text-primary-green"
          label={t('dashStatCrops')}
          value="8"
          hint={t('dashStatCropsHint')}
        />
        <StatCard
          icon={<Ruler className="w-5 h-5" />}
          accent="bg-harvest-yellow/20 text-harvest-yellow"
          label={t('dashStatLand')}
          value={land != null ? `${land}` : '—'}
          hint={`${t('dashStatLandHint')}${user?.region ? ` · ${user.region}` : ''}`}
        />
        <StatCard
          icon={<Languages className="w-5 h-5" />}
          accent="bg-info-blue/10 text-info-blue"
          label={t('dashStatLanguages')}
          value="3"
          hint={t('dashStatLanguagesHint')}
        />
        <StatCard
          icon={<FlaskConical className="w-5 h-5" />}
          accent="bg-danger-red/10 text-danger-red"
          label={t('dashStatSoil')}
          value="—"
          hint={t('dashStatSoilHint')}
        />
      </section>

      {/* -------- Recent advice + quick actions ──────── */}
      <section className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{t('dashRecentTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('dashRecentBody')}</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/crop-recommendation">
                {t('dashRecentViewAll')}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {recents.length === 0 ? (
            <EmptyRecents t={t} />
          ) : (
            <ul className="space-y-2">
              {recents.map((c) => (
                <li key={`${c.id}-${c.at}`}>
                  <Link
                    to="/crop-recommendation"
                    state={{ cropId: c.id }}
                    className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-secondary transition-colors"
                  >
                    <div className="w-9 h-9 rounded-md bg-primary-green/10 text-primary-green flex items-center justify-center shrink-0">
                      <Sprout className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {c.crop_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {c.season || ''}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-foreground">{t('dashTipTitle')}</h2>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-md bg-harvest-yellow/20 text-harvest-yellow flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t('dashTipBody')}</p>
          </div>
        </div>
      </section>

      {/* -------- Quick actions ──────── */}
      <section className="bg-white rounded-xl border border-border p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-foreground">{t('dashQuickActionsTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('dashQuickActionsBody')}</p>
        </div>
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickAction
            to="/crop-recommendation"
            icon={<Wheat className="w-5 h-5" />}
            titleKey="dashActionGetAdvice"
            descKey="dashActionGetAdviceDesc"
            accent="bg-primary-green/10 text-primary-green"
            t={t}
          />
          <QuickAction
            to="/soil-prediction"
            icon={<FlaskConical className="w-5 h-5" />}
            titleKey="dashActionSoil"
            descKey="dashActionSoilDesc"
            accent="bg-info-blue/10 text-info-blue"
            t={t}
          />
          <QuickAction
            to="/disease-library"
            icon={<Bug className="w-5 h-5" />}
            titleKey="dashActionDisease"
            descKey="dashActionDiseaseDesc"
            accent="bg-danger-red/10 text-danger-red"
            t={t}
          />
          <QuickAction
            to="/chatbot"
            icon={<MessageCircle className="w-5 h-5" />}
            titleKey="dashActionChatbot"
            descKey="dashActionChatbotDesc"
            accent="bg-harvest-yellow/20 text-harvest-yellow"
            t={t}
          />
        </ul>
      </section>
    </div>
  );
}

// --------------------- helpers ---------------------

function StatCard({
  icon,
  accent,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-md ${accent} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold text-foreground leading-tight mt-1">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1 leading-snug">{hint}</p>}
    </div>
  );
}

function QuickAction({
  to,
  icon,
  titleKey,
  descKey,
  accent,
  t,
}: {
  to: string;
  icon: React.ReactNode;
  titleKey: string;
  descKey: string;
  accent: string;
  t: (k: string) => string;
}) {
  return (
    <li>
      <Link
        to={to}
        className="group block h-full rounded-lg border border-border p-4 hover:border-primary-green hover:shadow-sm transition-all"
      >
        <div className={`w-10 h-10 rounded-md ${accent} flex items-center justify-center mb-3`}>
          {icon}
        </div>
        <p className="font-medium text-foreground text-sm">{t(titleKey)}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t(descKey)}</p>
      </Link>
    </li>
  );
}

function EmptyRecents({ t }: { t: (k: string) => string }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
      <div className="w-10 h-10 rounded-full bg-primary-green/10 text-primary-green flex items-center justify-center mx-auto mb-3">
        <Sprout className="w-5 h-5" />
      </div>
      <p className="text-sm text-muted-foreground">{t('dashRecentEmpty')}</p>
    </div>
  );
}