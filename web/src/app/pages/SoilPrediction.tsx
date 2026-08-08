// pages/SoilPrediction.tsx
// Group 4: SoilPrediction.
//
// Two-section layout:
//   - Form (left): image upload, soil type select, pH/NPK/OM/salinity
//     inputs. Submit posts multipart/form-data to /api/soil-predictions.
//   - Recent predictions (right): GET /api/soil-predictions, listed most
//     recent first with predicted type, confidence, top recommendation.

import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Upload,
  Loader2,
  FlaskConical,
  CheckCircle2,
  X,
  Image as ImageIcon,
  TrendingUp,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageProvider';

interface Prediction {
  id: number;
  image_path: string;
  predicted_type: string;
  confidence: number;
  recommendations: string[];
  created_at: string;
}

const SOIL_TYPES = ['Loamy', 'Sandy', 'Clay', 'Silty', 'Peaty', 'Chalky'];
const LEVELS = ['low', 'medium', 'high'];

export function SoilPrediction() {
  const { t } = useLanguage();

  // ----- form state -----
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [soilType, setSoilType] = useState<string>('');
  const [ph, setPh] = useState('');
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [organicMatter, setOrganicMatter] = useState('');
  const [salinity, setSalinity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ----- history state -----
  const [history, setHistory] = useState<Prediction[] | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ predictions: Prediction[] }>('/api/soil-predictions')
      .then((res) => {
        if (!cancelled) setHistory(res.predictions);
      })
      .catch((err) => {
        if (!cancelled) setHistoryError(err instanceof ApiError ? err.message : t('soilGenericError'));
      });
    return () => {
      cancelled = true;
    };
  }, [t, result]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageFile) {
      toast.error(t('soilNeedImage'));
      return;
    }

    setSubmitting(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('image', imageFile);
      if (soilType) fd.append('soil_type', soilType);
      if (ph) fd.append('ph', ph);
      if (nitrogen) fd.append('nitrogen', nitrogen);
      if (phosphorus) fd.append('phosphorus', phosphorus);
      if (potassium) fd.append('potassium', potassium);
      if (organicMatter) fd.append('organic_matter', organicMatter);
      if (salinity) fd.append('salinity', salinity);

      const res = await apiFetch<Prediction>('/api/soil-predictions', {
        method: 'POST',
        body: fd,
      });
      setResult(res);
      toast.success(t('soilSuccess'));
      // reset just the file input
      setImageFile(null);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('soilGenericError'));
    } finally {
      setSubmitting(false);
    }
  }

  function clearImage() {
    setImageFile(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('soilTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('soilSubtitle')}</p>
      </header>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ----- Form column ----- */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-white border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">{t('soilFormTitle')}</h2>

          {/* Image upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground block">{t('soilImage')}</label>
            <div className="border-2 border-dashed border-border rounded-lg p-4">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt={t('soilImage')}
                    className="w-full max-h-64 object-contain rounded-md bg-secondary"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 end-2 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label={t('soilClearImage')}
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
                  <span className="text-sm font-medium">{t('soilUploadCta')}</span>
                  <span className="text-xs">{t('soilUploadHint')}</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Soil type + pH */}
          <div className="grid sm:grid-cols-2 gap-4">
            <SelectInput
              label={t('soilType')}
              value={soilType}
              onChange={setSoilType}
              placeholder={t('soilTypePlaceholder')}
              options={SOIL_TYPES}
            />
            <InputField
              label={t('soilPh')}
              hint="0–14"
              value={ph}
              onChange={setPh}
              type="number"
              placeholder="6.5"
              min="0"
              max="14"
              step="0.1"
            />
          </div>

          {/* NPK levels */}
          <div className="grid sm:grid-cols-3 gap-4">
            <SelectInput label={t('soilNitrogen')} value={nitrogen} onChange={setNitrogen} options={LEVELS} placeholder="—" />
            <SelectInput label={t('soilPhosphorus')} value={phosphorus} onChange={setPhosphorus} options={LEVELS} placeholder="—" />
            <SelectInput label={t('soilPotassium')} value={potassium} onChange={setPotassium} options={LEVELS} placeholder="—" />
          </div>

          {/* OM + salinity */}
          <div className="grid sm:grid-cols-2 gap-4">
            <InputField
              label={t('soilOrganicMatter')}
              hint="%"
              value={organicMatter}
              onChange={setOrganicMatter}
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="1.5"
            />
            <SelectInput label={t('soilSalinity')} value={salinity} onChange={setSalinity} options={LEVELS} placeholder="—" />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting || !imageFile} className="min-w-40">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}
              {submitting ? t('soilSubmitting') : t('soilSubmit')}
            </Button>
          </div>
        </form>

        {/* ----- Result / History column ----- */}
        <aside className="lg:col-span-2 space-y-4">
          {result && <ResultCard prediction={result} t={t} />}

          <div className="bg-white border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-3">{t('soilHistoryTitle')}</h2>
            {historyError && (
              <p className="text-sm text-danger-red bg-danger-red/10 border border-danger-red/30 rounded-md px-3 py-2">
                {historyError}
              </p>
            )}
            {!history && !historyError && (
              <p className="text-sm text-muted-foreground">{t('soilLoading')}</p>
            )}
            {history && history.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">{t('soilHistoryEmpty')}</p>
              </div>
            )}
            {history && history.length > 0 && (
              <ul className="space-y-2">
                {history.map((p) => (
                  <li
                    key={p.id}
                    className="border border-border rounded-lg p-3 hover:border-primary-green/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-sm text-foreground">{p.predicted_type}</p>
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {p.recommendations[0]}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

// ---------------------- helpers ----------------------

function InputField({
  label,
  hint,
  value,
  onChange,
  type = 'text',
  ...rest
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground block">
        {label}
        {hint && <span className="text-xs text-muted-foreground ms-2">({hint})</span>}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11"
        {...rest}
      />
    </div>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-md border border-input bg-input-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultCard({ prediction, t }: { prediction: Prediction; t: (k: string) => string }) {
  const confPct = useMemo(() => Math.round(prediction.confidence * 100), [prediction.confidence]);
  return (
    <div className="bg-white border border-primary-green rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-full bg-primary-green/10 text-primary-green flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{t('soilResultLabel')}</p>
          <p className="font-semibold text-foreground">{prediction.predicted_type}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3 text-sm">
        <TrendingUp className="w-4 h-4 text-primary-green" />
        <span className="text-muted-foreground">{t('soilConfidence')}:</span>
        <span className="font-medium">{confPct}%</span>
      </div>

      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
        {t('soilRecommendations')}
      </p>
      <ul className="space-y-1.5">
        {prediction.recommendations.map((rec, i) => (
          <li key={i} className="text-sm text-foreground leading-relaxed flex items-start gap-2">
            <span className="text-primary-green mt-1 shrink-0">•</span>
            <span>{rec}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}