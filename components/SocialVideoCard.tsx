import React, { useState } from 'react';
import { SocialPlatform, SocialVideo } from '../types';

export function detectSocialPlatform(url: string): SocialPlatform {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  return 'instagram';
}

export function getYoutubeId(url: string): string | null {
  const trimmed = url.trim();
  const shorts = trimmed.match(/youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i);
  if (shorts?.[1]) return shorts[1];
  const watch = trimmed.match(/[?&]v=([A-Za-z0-9_-]+)/i);
  if (watch?.[1]) return watch[1];
  const shortUrl = trimmed.match(/youtu\.be\/([A-Za-z0-9_-]+)/i);
  if (shortUrl?.[1]) return shortUrl[1];
  return null;
}

export function getEmbedUrl(url: string, platform?: SocialPlatform): string | null {
  const p = platform || detectSocialPlatform(url);
  const trimmed = url.trim();

  if (p === 'instagram') {
    const match = trimmed.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (match?.[1]) {
      return `https://www.instagram.com/reel/${match[1]}/embed/`;
    }
    return null;
  }

  if (p === 'tiktok') {
    const match = trimmed.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i) || trimmed.match(/\/video\/(\d+)/i);
    if (match?.[1]) {
      return `https://www.tiktok.com/embed/v2/${match[1]}`;
    }
    return null;
  }

  if (p === 'youtube') {
    const ytId = getYoutubeId(trimmed);
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1`;
    return null;
  }

  return null;
}

const PLATFORM_STYLE: Record<SocialPlatform, { label: string; gradient: string; icon: string }> = {
  instagram: {
    label: 'Instagram',
    gradient: 'from-[#833ab4] via-[#E1306C] to-[#F77737]',
    icon: 'photo_camera',
  },
  tiktok: {
    label: 'TikTok',
    gradient: 'from-slate-900 via-slate-800 to-black',
    icon: 'music_note',
  },
  youtube: {
    label: 'YouTube',
    gradient: 'from-red-600 to-red-800',
    icon: 'smart_display',
  },
};

interface SocialVideoCardProps {
  video: SocialVideo;
  onCompanyClick?: (companyId: string) => void;
}

const SocialVideoCard: React.FC<SocialVideoCardProps> = ({ video, onCompanyClick }) => {
  const [openModal, setOpenModal] = useState(false);

  const ytId = video.platform === 'youtube' ? getYoutubeId(video.video_url) : null;
  const coverImage =
    video.thumbnail_url ||
    (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

  const embedUrl = getEmbedUrl(video.video_url, video.platform);
  const style = PLATFORM_STYLE[video.platform] || PLATFORM_STYLE.instagram;
  const displayHandle =
    video.handle ||
    (video.company_name ? `@${video.company_name.toLowerCase().replace(/\s+/g, '.')}` : '@easy.patagonia');

  const handleCardClick = () => {
    if (embedUrl) {
      setOpenModal(true);
    } else {
      window.open(video.video_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      {/* ── TARJETA ESTILO SOCIAL WALL ───────────────────────────────────── */}
      <div
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
        className="group relative w-full aspect-[4/5] rounded-[1.75rem] overflow-hidden cursor-pointer bg-slate-900 border border-white/10 shadow-xl hover:shadow-2xl hover:border-[#dd6e42]/60 transition-all duration-300"
      >
        {coverImage ? (
          <img
            src={coverImage}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${style.gradient} opacity-85 group-hover:scale-105 transition-transform duration-700 flex items-center justify-center`}>
            <span className="material-symbols-outlined text-7xl text-white/30">
              {style.icon}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/20 pointer-events-none" />

        <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
          <span className="w-8 h-8 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow">
            <span className="material-symbols-outlined text-base">play_arrow</span>
          </span>
          <span className={`px-2.5 py-1 rounded-full bg-gradient-to-r ${style.gradient} text-white text-[10px] font-black uppercase tracking-wider shadow`}>
            {style.label}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 z-10 text-left">
          <p className="text-[11px] font-black text-[#dd6e42] tracking-wide truncate">
            {displayHandle}
          </p>
          <h3 className="text-sm md:text-base font-bold text-white leading-snug line-clamp-2 mt-0.5">
            {video.title}
          </h3>
          {video.company_name && video.company_id && onCompanyClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCompanyClick(video.company_id!);
              }}
              className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full transition-colors"
            >
              <span>Ver {video.company_name}</span>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          )}
        </div>
      </div>

      {/* ── MODAL REPRODUCTOR DE VIDEO ────────────────────────────────────── */}
      {openModal && embedUrl && (
        <div
          className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setOpenModal(false)}
        >
          <div
            className="relative w-full max-w-md bg-slate-950 border border-white/15 rounded-[2rem] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-black text-[#dd6e42] uppercase tracking-wider">{displayHandle}</p>
                <p className="text-sm font-bold text-white truncate">{video.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="w-full aspect-[9/16] max-h-[70vh] bg-black">
              <iframe
                src={embedUrl}
                title={video.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="p-3.5 bg-slate-900 border-t border-white/10 flex items-center justify-between gap-3">
              <a
                href={video.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black uppercase tracking-wider text-center transition-all"
              >
                Abrir en {style.label} ↗
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SocialVideoCard;
