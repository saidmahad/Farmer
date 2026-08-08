// pages/Reports.tsx
// Group 5: Reports.
//
// Summary analytics for the signed-in farmer:
//   - Four stat tiles (catalog size, soil predictions, feedback, chats).
//   - An activity summary panel (most-recent crop viewed).
//   - A one-click CSV export that downloads the same data from
//     GET /api/reports/export.
//
// The stat tile styling mirrors the Dashboard's StatCard.

import { useEffect, useState } from 'react';
import {
  Download,
  Loader2,
  Wheat,
  FlaskConical,
  MessageSquare,
  MessageCircle,
  Sprout,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/i18n/LanguageProvider';

interface ReportsStats {
  cropCount: number;
  soilPredictions: number;
  feedbackCount: number;
  chatMessages: number;
  lastViewedCrop?: string | null;
}

export function Reports() {
  const { t } = useLanguage();

  const [stats, setStats] = useState<ReportsStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ stats: ReportsStats }>('/api/reports')
      .then((res) => {
        if (!cancelled) setStats(res.stats);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('reportsGenericError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  async function handleExport() {
    setExporting(true);
    try {
      const csv = await apiFetch<string>('/api/reports/export');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'reports.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('reportsExportSuccess'));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('reportsGenericError'));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{t('reportsTitle')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('reportsSubtitle')}</p>
        </div>
        <Button onClick={handleExport} disabled={exporting || !stats} variant="outline">
          {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {t('reportsExport')}
        </Button>
      </header>

      {error && (
        <div className="bg-danger-red/10 border border-danger-red/30 text-danger-red text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {!stats && !error && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t('reportsLoading')}
        </div>
      )}

      {stats && (
        <>
          {/* ----- Stat tiles ----- */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Wheat className="w-5 h-5" />}
              accent="bg-primary-green/10 text-primary-green"
              label={t('reportsCropCount')}
              value={String(stats.cropCount ?? 0)}
            />
            <StatCard
              icon={<FlaskConical className="w-5 h-5" />}
              accent="bg-info-blue/10 text-info-blue"
              label={t('reportsSoilCount')}
              value={String(stats.soilPredictions ?? 0)}
            />
            <StatCard
              icon={<MessageSquare className="w-5 h-5" />}
              accent="bg-harvest-yellow/20 text-harvest-yellow"
              label={t('reportsFeedbackCount')}
              value={String(stats.feedbackCount ?? 0)}
            />
            <StatCard
              icon={<MessageCircle className="w-5 h-5" />}
              accent="bg-danger-red/10 text-danger-red"
              label={t('reportsChatCount')}
              value={String(stats.chatMessages ?? 0)}
            />
          </section>

          {/* ----- Activity summary ----- */}
          <section className="bg-white border border-border rounded-xl p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-foreground">{t('reportsActivityTitle')}</h2>
              <p className="text-sm text-muted-foreground">{t('reportsActivityBody')}</p>
            </div>
            <div className="flex items-center gap-3 border border-border rounded-lg p-4">
              <div className="w-10 h-10 rounded-md bg-primary-green/10 text-primary-green flex items-center justify-center shrink-0">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {t('reportsLastCrop')}
                </p>
                <p className="font-medium text-foreground truncate">
                  {stats.lastViewedCrop || '—'}
                </p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

// ---------------------- helpers ----------------------

function StatCard({
  icon,
  accent,
  label,
  value,
}: {
  icon: React.ReactNode;
  accent: string;
  label: string;
  value: string;
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
    </div>
  );
}
