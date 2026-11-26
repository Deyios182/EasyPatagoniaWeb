import React, { useState } from 'react';
import { SocialPlatform, SocialVideo } from '../types';

export function detectSocialPlatform(url: string): SocialPlatform {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok.com')) return 'tiktok';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  return 'instagram';
}

export function isDirectVideoUrl(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url.trim());
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
  if (isDirectVideoUrl(url)) return null;
  const p = platform || detectSocialPlatform(url);
  const trimmed = url.trim();

  if (p === 'instagram') {
    const match = trimmed.match(/instagram\.com\/(?:reel|p|tv)\/([A-Za-z0-9_-]+)/i);
    if (match?.[1]) {
      return `https://www.instagram.com/reel/${match[1]}/embed/captioned/`;
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
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`;
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
  const [isPlaying, setIsPlaying] = useState(false);

  const directVideo = isDirectVideoUrl(video.video_url);
  const ytId = video.platform === 'youtube' ? getYoutubeId(video.video_url) : null;
  const coverImage =
    video.thumbnail_url ||
    (ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : null);

  const embedUrl = getEmbedUrl(video.video_url, video.platform);
  const canPlayInline = directVideo || Boolean(embedUrl);
  const style = PLATFORM_STYLE[video.platform] || PLATFORM_STYLE.instagram;
  const displayHandle =
    video.handle ||
    (video.company_name ? `@${video.company_name.toLowerCase().replace(/\s+/g, '.')}` : '@easy.patagonia');

  const handleCardClick = () => {
    if (canPlayInline) {
      setIsPlaying(true);
    } else {
      window.open(video.video_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="group relative w-full aspect-[4/5] rounded-[1.75rem] overflow-hidden bg-slate-900 border border-white/10 shadow-xl hover:shadow-2xl hover:border-[#dd6e42]/60 transition-all duration-300">
      {isPlaying ? (
        <div className="relative w-full h-full bg-black">
          {directVideo ? (
            <video
              src={video.video_url}
              controls
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : embedUrl ? (
            <iframe
              src={embedUrl}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : null}

          {/* Controles superiores sobre el reproductor */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20">
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              className="pointer-events-auto w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 flex items-center justify-center shadow-lg"
              title="Cerrar reproductor"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
            <a
              href={video.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto px-2.5 py-1 rounded-full bg-black/75 hover:bg-black text-white border border-white/20 text-[10px] font-bold flex items-center gap-1 shadow-lg"
              title={`Abrir en ${style.label}`}
            >
              <span>Abrir</span>
              <span className="material-symbols-outlined text-xs">open_in_new</span>
            </a>
          </div>
        </div>
      ) : (
        <div
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
          className="relative w-full h-full cursor-pointer"
        >
          {/* Imagen de portada o fondo degradado */}
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

          {/* Degradado oscuro inferior */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/20 pointer-events-none" />

          {/* Iconos superiores derechos (Play + Plataforma) */}
          <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-10">
            <span className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/25 flex items-center justify-center text-white shadow group-hover:scale-110 group-hover:bg-[#dd6e42] transition-all">
              <span className="material-symbols-outlined text-lg">play_arrow</span>
            </span>
            <span className={`px-2.5 py-1 rounded-full bg-gradient-to-r ${style.gradient} text-white text-[10px] font-black uppercase tracking-wider shadow`}>
              {directVideo ? 'Video' : style.label}
            </span>
          </div>

          {/* Meta inferior izquierda (@handle + título + empresa) */}
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
      )}
    </div>
  );
};

export default SocialVideoCard;
