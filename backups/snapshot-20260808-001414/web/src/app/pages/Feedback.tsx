// pages/Feedback.tsx
// Group 5: Feedback.
//
// Two-column layout (mirrors SoilPrediction):
//   - Form (3/5): category, 1–5 star rating, message, optional screenshot.
//     Submits multipart/form-data to POST /api/feedback.
//   - Recent submissions (2/5): GET /api/feedback, listed newest first with
//     a color-coded status badge (open / in_progress / resolved).

import { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Upload, X, Loader2, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/i18n/LanguageProvider';

interface FeedbackItem {
  id: number;
  category?: string | null;
  rating?: number | null;
  message: string;
  screenshot_url?: string | null;
  status?: string | null;
  created_at?: string | null;
}

const CATEGORY_OPTIONS = [
  { value: 'bug', labelKey: 'feedbackCategoryBug' },
  { value: 'feature', labelKey: 'feedbackCategoryFeature' },
  { value: 'general', labelKey: 'feedbackCategoryGeneral' },
] as const;

// Category → translated label. Unknown values fall through to the raw slug.
function categoryLabel(category: string | null | undefined, t: (k: string) => string): string {
  switch (category) {
    case 'bug': return t('feedbackCategoryBug');
    case 'feature': return t('feedbackCategoryFeature');
    case 'general': return t('feedbackCategoryGeneral');
    default: return category || '—';
  }
}

function statusClass(status?: string | null): string {
  switch ((status || '').toLowerCase()) {
    case 'open': return 'bg-harvest-yellow/20 text-harvest-yellow border-harvest-yellow/40';
    case 'in_progress': return 'bg-info-blue/10 text-info-blue border-info-blue/30';
    case 'resolved': return 'bg-primary-green/10 text-primary-green border-primary-green/30';
    default: return 'bg-secondary text-muted-foreground border-border';
  }
}

function statusLabel(status: string | null | undefined, t: (k: string) => string): string {
  switch ((status || '').toLowerCase()) {
    case 'open': return t('feedbackStatusOpen');
    case 'in_progress': return t('feedbackStatusInProgress');
    case 'resolved': return t('feedbackStatusResolved');
    default: return status || '—';
  }
}

export function Feedback() {
  const { t } = useLanguage();

  // ----- form state -----
  const [category, setCategory] = useState<string>('general');
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // ----- history state -----
  const [history, setHistory] = useState<FeedbackItem[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ feedback: FeedbackItem[] }>('/api/feedback')
      .then((res) => {
        if (!cancelled) setHistory(res.feedback);
      })
      .catch((err) => {
        if (!cancelled) setHistoryError(err instanceof ApiError ? err.message : t('feedbackGenericError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    if (!screenshotFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(screenshotFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [screenshotFile]);

  const canSubmit = useMemo(() => message.trim().length > 0 && !submitting, [message, submitting]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length === 0) {
      toast.error(t('feedbackNeedMessage'));
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('category', category);
      fd.append('rating', String(rating));
      fd.append('message', message.trim());
      if (screenshotFile) fd.append('screenshot', screenshotFile);

      await apiFetch('/api/feedback', { method: 'POST', body: fd });
      toast.success(t('feedbackSuccess'));

      // Reset the form and refresh the history list.
      setCategory('general');
      setRating(0);
      setMessage('');
      setScreenshotFile(null);
      if (fileRef.current) fileRef.current.value = '';
      apiFetch<{ feedback: FeedbackItem[] }>('/api/feedback')
        .then((res) => setHistory(res.feedback))
        .catch((err) =>
          setHistoryError(err instanceof ApiError ? err.message : t('feedbackGenericError')),
        );
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('feedbackGenericError'));
    } finally {
      setSubmitting(false);
    }
  }

  function clearImage() {
    setScreenshotFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('feedbackTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('feedbackSubtitle')}</p>
      </header>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ----- Form column ----- */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white border border-border rounded-xl p-6 space-y-5">
          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">{t('feedbackCategory')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-11 w-full rounded-md border border-input bg-input-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">{t('feedbackRating')}</label>
            <div className="flex items-center gap-1" role="radiogroup" aria-label={t('feedbackRating')}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="p-1 rounded-md hover:bg-secondary transition-colors"
                  aria-label={`${n}/5`}
                  role="radio"
                  aria-checked={rating === n}
                >
                  <Star
                    className={[
                      'w-6 h-6 transition-colors',
                      n <= rating ? 'fill-harvest-yellow text-harvest-yellow' : 'text-muted-foreground',
                    ].join(' ')}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="text-sm text-muted-foreground ms-2">{rating}/5</span>
              )}
            </div>
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block" htmlFor="feedback-message">
              {t('feedbackMessage')}
            </label>
            <Textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={t('feedbackMessage')}
              className="min-h-28"
            />
          </div>

          {/* Screenshot upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">{t('feedbackScreenshot')}</label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt={t('feedbackScreenshot')}
                    className="w-full max-h-64 object-contain rounded-md bg-secondary"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 end-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={t('feedbackRemoveImage')}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full py-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium">{t('feedbackUploadCta')}</span>
                  <span className="text-xs">{t('feedbackUploadHint')}</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setScreenshotFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={!canSubmit} className="min-w-40">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
              {submitting ? t('feedbackSubmitting') : t('feedbackSubmit')}
            </Button>
          </div>
        </form>

        {/* ----- Recent feedback column ----- */}
        <aside className="lg:col-span-2 bg-white border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-3">{t('feedbackRecentTitle')}</h2>

          {historyError && (
            <p className="text-sm text-danger-red bg-danger-red/10 border border-danger-red/30 rounded-md px-3 py-2">
              {historyError}
            </p>
          )}
          {!history && !historyError && (
            <p className="text-sm text-muted-foreground">{t('feedbackLoading')}</p>
          )}
          {history && history.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('feedbackEmpty')}</p>
            </div>
          )}
          {history && history.length > 0 && (
            <ul className="space-y-2">
              {history.map((f) => (
                <li
                  key={f.id}
                  className="border border-border rounded-lg p-3 hover:border-primary-green/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      {categoryLabel(f.category, t)}
                    </p>
                    {f.rating != null && f.rating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-harvest-yellow shrink-0">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={[
                              'w-3.5 h-3.5',
                              i < f.rating! ? 'fill-harvest-yellow text-harvest-yellow' : 'text-muted-foreground',
                            ].join(' ')}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed line-clamp-2">{f.message}</p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {f.created_at && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(f.created_at).toLocaleDateString()}
                      </span>
                    )}
                    <span
                      className={[
                        'text-xs px-2 py-0.5 rounded-full border',
                        statusClass(f.status),
                      ].join(' ')}
                    >
                      {statusLabel(f.status, t)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
