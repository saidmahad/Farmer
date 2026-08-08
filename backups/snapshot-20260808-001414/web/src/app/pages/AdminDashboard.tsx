// pages/AdminDashboard.tsx
// Group 5: Admin.
//
// Feedback triage dashboard for admins. Lists every submission
// (GET /api/feedback/admin) in a table with status filter chips.
// Clicking a row expands it to show the full message and admin notes,
// plus an inline form to update status / add notes
// (PATCH /api/feedback/:id/admin).

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Star, ChevronDown, ChevronUp, MessageSquare, User } from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/i18n/LanguageProvider';

interface AdminFeedback {
  id: number;
  user_name?: string | null;
  category?: string | null;
  rating?: number | null;
  message?: string | null;
  status?: string | null;
  admin_notes?: string | null;
  created_at?: string | null;
}

type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';

const STATUS_OPTIONS = [
  { value: 'open', labelKey: 'adminFilterOpen' },
  { value: 'in_progress', labelKey: 'adminFilterInProgress' },
  { value: 'resolved', labelKey: 'adminFilterResolved' },
] as const;

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

export function AdminDashboard() {
  const { t } = useLanguage();

  const [list, setList] = useState<AdminFeedback[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [edit, setEdit] = useState<{ status: string; notes: string }>({ status: 'open', notes: '' });
  const [updating, setUpdating] = useState(false);

  // ----- fetch all feedback -----
  useEffect(() => {
    let cancelled = false;
    apiFetch<{ feedback: AdminFeedback[] }>('/api/feedback/admin')
      .then((res) => {
        if (!cancelled) setList(res.feedback);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('adminGenericError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filtered = useMemo(() => {
    if (!list) return [];
    if (filter === 'all') return list;
    return list.filter((f) => (f.status || '').toLowerCase() === filter);
  }, [list, filter]);

  function toggleRow(f: AdminFeedback) {
    if (expandedId === f.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(f.id);
    setEdit({ status: (f.status || 'open').toLowerCase(), notes: f.admin_notes || '' });
  }

  async function handleUpdate(f: AdminFeedback) {
    setUpdating(true);
    try {
      const updated = await apiFetch<AdminFeedback>(`/api/feedback/${f.id}/admin`, {
        method: 'PATCH',
        body: { status: edit.status, admin_notes: edit.notes },
      });
      toast.success(t('adminUpdateSuccess'));
      setList((prev) =>
        prev ? prev.map((item) => (item.id === f.id ? { ...item, ...updated } : item)) : prev,
      );
      setExpandedId(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('adminGenericError'));
    } finally {
      setUpdating(false);
    }
  }

  const FILTERS: { id: StatusFilter; labelKey: string }[] = [
    { id: 'all', labelKey: 'adminFilterAll' },
    { id: 'open', labelKey: 'adminFilterOpen' },
    { id: 'in_progress', labelKey: 'adminFilterInProgress' },
    { id: 'resolved', labelKey: 'adminFilterResolved' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('adminTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('adminFeedback')}</p>
      </header>

      {/* Status filter chips */}
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

      {error && (
        <div className="bg-danger-red/10 border border-danger-red/30 text-danger-red text-sm rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* Feedback table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        {!list && !error && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground px-6 py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('adminLoading')}
          </div>
        )}

        {list && filtered.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t('adminEmpty')}</p>
          </div>
        )}

        {list && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-start px-4 py-3 text-muted-foreground font-medium">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      {t('adminUserName')}
                    </span>
                  </th>
                  <th className="text-start px-4 py-3 text-muted-foreground font-medium">
                    {t('adminCategory')}
                  </th>
                  <th className="text-start px-4 py-3 text-muted-foreground font-medium">
                    {t('adminRating')}
                  </th>
                  <th className="text-start px-4 py-3 text-muted-foreground font-medium">
                    {t('adminMessage')}
                  </th>
                  <th className="text-start px-4 py-3 text-muted-foreground font-medium">
                    {t('adminStatus')}
                  </th>
                  <th className="text-start px-4 py-3 text-muted-foreground font-medium">
                    {t('adminDate')}
                  </th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const expanded = expandedId === f.id;
                  return (
                    <FragmentRow
                      key={f.id}
                      feedback={f}
                      expanded={expanded}
                      onToggle={() => toggleRow(f)}
                      edit={edit}
                      setEdit={setEdit}
                      updating={updating}
                      onUpdate={() => handleUpdate(f)}
                      t={t}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------- FragmentRow (row + expanded detail) ----------------------

function FragmentRow({
  feedback: f,
  expanded,
  onToggle,
  edit,
  setEdit,
  updating,
  onUpdate,
  t,
}: {
  feedback: AdminFeedback;
  expanded: boolean;
  onToggle: () => void;
  edit: { status: string; notes: string };
  setEdit: (e: { status: string; notes: string }) => void;
  updating: boolean;
  onUpdate: () => void;
  t: (k: string) => string;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={[
          'border-b border-border cursor-pointer hover:bg-secondary/50 transition-colors last:border-b-0',
          expanded ? 'bg-secondary/40' : '',
        ].join(' ')}
      >
        <td className="px-4 py-3 font-medium text-foreground">{f.user_name || '—'}</td>
        <td className="px-4 py-3 text-muted-foreground">{categoryLabel(f.category, t)}</td>
        <td className="px-4 py-3">
          {f.rating != null && f.rating > 0 ? (
            <span className="inline-flex items-center gap-0.5">
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
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-muted-foreground max-w-56">
          <span className="line-clamp-1">{f.message || '—'}</span>
        </td>
        <td className="px-4 py-3">
          <span className={['text-xs px-2 py-0.5 rounded-full border', statusClass(f.status)].join(' ')}>
            {statusLabel(f.status, t)}
          </span>
        </td>
        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
          {f.created_at ? new Date(f.created_at).toLocaleDateString() : '—'}
        </td>
        <td className="px-4 py-3">
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-border bg-background">
          <td colSpan={7} className="px-4 py-4">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Full message */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    {t('adminMessage')}
                  </p>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {f.message || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">
                    {t('adminNotes')}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                    {f.admin_notes ? f.admin_notes : t('adminNoNotes')}
                  </p>
                </div>
              </div>

              {/* Update form */}
              <div className="space-y-3 border-t lg:border-t-0 lg:border-s border-border lg:ps-6 pt-4 lg:pt-0">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground block">{t('adminStatus')}</label>
                  <select
                    value={edit.status}
                    onChange={(e) => setEdit({ ...edit, status: e.target.value })}
                    className="h-10 w-full rounded-md border border-input bg-input-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {t(opt.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground block">{t('adminNotes')}</label>
                  <Textarea
                    value={edit.notes}
                    onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                    rows={3}
                    placeholder={t('adminNotes')}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={onUpdate} disabled={updating}>
                    {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                    {t('adminUpdate')}
                  </Button>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
