// pages/VideoHub.tsx
// Group 5: VideoHub.
//
// Searchable grid of farming tutorial videos pulled from /api/videos.
// Each card shows the YouTube thumbnail, title, duration, topic, and the
// crop the video relates to. Clicking a card opens an inline embedded
// YouTube player (a fixed overlay modal). Filtering is done client-side
// over the full list so the grid stays snappy on slow rural connections.

import { useEffect, useMemo, useState } from 'react';
import { Search, Loader2, Play, X, Clock, Sprout, Video } from 'lucide-react';

import { apiFetch, ApiError } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/i18n/LanguageProvider';

interface Video {
  id: number;
  slug: string;
  title: string;
  topic?: string | null;
  crop_slug?: string | null;
  duration?: string | null;
  youtube_id: string;
  thumbnail_url?: string | null;
  description?: string | null;
}

// Same crop label map used by DiseaseLibrary so a crop slug renders as a
// friendly name. Anything not in the map falls back to the raw slug.
const CROP_LABELS: Record<string, string> = {
  rice: 'Rice', wheat: 'Wheat', tomato: 'Tomato', cotton: 'Cotton',
  maize: 'Maize', groundnut: 'Groundnut', onion: 'Onion', sugarcane: 'Sugarcane',
};

export function VideoHub() {
  const { t } = useLanguage();

  const [videos, setVideos] = useState<Video[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [active, setActive] = useState<Video | null>(null);

  // ----- fetch videos -----
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiFetch<{ videos: Video[] }>('/api/videos')
      .then((res) => {
        if (!cancelled) setVideos(res.videos);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('videoGenericError'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  // ----- topic chips derived from the data -----
  const topics = useMemo(() => {
    if (!videos) return ['all'];
    const set = new Set<string>(['all']);
    videos.forEach((v) => v.topic && set.add(v.topic));
    return Array.from(set);
  }, [videos]);

  // ----- client-side search + filter -----
  const filtered = useMemo(() => {
    if (!videos) return [];
    const q = search.trim().toLowerCase();
    return videos.filter((v) => {
      if (filter !== 'all' && v.topic !== filter) return false;
      if (!q) return true;
      return (
        v.title.toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q) ||
        (v.topic || '').toLowerCase().includes(q) ||
        (v.crop_slug && CROP_LABELS[v.crop_slug]?.toLowerCase().includes(q)) ||
        (v.crop_slug || '').toLowerCase().includes(q)
      );
    });
  }, [videos, search, filter]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-foreground">{t('videoTitle')}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t('videoSubtitle')}</p>
      </header>

      {/* ----- Search + topic chips ----- */}
      <div className="bg-white border border-border rounded-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('videoSearchPlaceholder')}
            className="ps-9 h-11"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {topics.map((c) => {
            const activeChip = filter === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setFilter(c)}
                className={[
                  'px-3 h-8 rounded-full border text-sm transition-all',
                  activeChip
                    ? 'border-primary-green bg-primary-green/10 text-primary-green font-medium'
                    : 'border-border text-foreground hover:border-primary-green/50',
                ].join(' ')}
              >
                {c === 'all' ? t('videoFilterAll') : c}
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

      {/* ----- Grid / skeleton / empty ----- */}
      {loading ? (
        <SkeletonGrid />
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-border rounded-xl px-4 py-12 text-center">
          <div className="w-12 h-12 rounded-full bg-primary-green/10 text-primary-green flex items-center justify-center mx-auto mb-3">
            <Video className="w-6 h-6" />
          </div>
          <p className="font-medium text-foreground">{t('videoEmptyTitle')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('videoEmptyBody')}</p>
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((v) => (
            <VideoCard key={v.slug} video={v} onPlay={() => setActive(v)} />
          ))}
        </ul>
      )}

      {active && <VideoPlayer video={active} onClose={() => setActive(null)} />}
    </div>
  );
}

// ---------------------- VideoCard ----------------------

function VideoCard({ video, onPlay }: { video: Video; onPlay: () => void }) {
  const thumbnail =
    video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_id}/hqdefault.jpg`;

  return (
    <li>
      <button
        type="button"
        onClick={onPlay}
        className="group w-full text-start bg-white border border-border rounded-xl overflow-hidden hover:border-primary-green/50 hover:shadow-sm transition-all"
      >
        {/* Thumbnail with play overlay */}
        <div className="relative">
          <img
            src={thumbnail}
            alt={video.title}
            loading="lazy"
            className="w-full h-40 object-cover bg-secondary"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-white/90 text-primary-green flex items-center justify-center opacity-90 group-hover:opacity-100 shadow-md">
              <Play className="w-5 h-5 fill-current ms-0.5" />
            </div>
          </div>
          {video.duration && (
            <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 text-xs text-white bg-black/70 rounded-md px-1.5 py-0.5">
              <Clock className="w-3 h-3" />
              {video.duration}
            </span>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-semibold text-foreground leading-snug line-clamp-2">{video.title}</h3>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            {video.topic && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                {video.topic}
              </span>
            )}
            {video.crop_slug && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-green/10 text-primary-green inline-flex items-center gap-1">
                <Sprout className="w-3 h-3" />
                {CROP_LABELS[video.crop_slug] || video.crop_slug}
              </span>
            )}
          </div>
          {video.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>
      </button>
    </li>
  );
}

// ---------------------- VideoPlayer (overlay modal) ----------------------

function VideoPlayer({ video, onClose }: { video: Video; onClose: () => void }) {
  const embedUrl = `https://www.youtube.com/embed/${video.youtube_id}?autoplay=1`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div
        className="w-full max-w-3xl bg-white rounded-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground text-sm truncate">{video.title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary shrink-0"
            aria-label="Close player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={video.title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------- Skeleton ----------------------

function SkeletonGrid() {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="bg-white border border-border rounded-xl overflow-hidden animate-pulse">
          <div className="w-full h-40 bg-secondary" />
          <div className="p-4 space-y-2">
            <div className="h-4 w-3/4 bg-secondary rounded" />
            <div className="h-3 w-1/2 bg-secondary rounded" />
            <div className="h-3 w-full bg-secondary rounded" />
          </div>
        </li>
      ))}
    </ul>
  );
}
