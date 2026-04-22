export type MediaSourceType = 'image' | 'youtube' | 'cloudinary';

export interface NormalizedMedia {
  source_type: MediaSourceType;
  original_url: string;
  thumbnail_url: string;
  validation_status: 'pending' | 'valid' | 'invalid' | 'placeholder';
}

const YOUTUBE_REGEX = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];

export function normalizeMediaUrl(url: string): NormalizedMedia {
  const trimmed = url.trim();

  if (!trimmed) {
    return {
      source_type: 'image',
      original_url: '',
      thumbnail_url: '',
      validation_status: 'invalid',
    };
  }

  const ytMatch = trimmed.match(YOUTUBE_REGEX);
  if (ytMatch) {
    const videoId = ytMatch[1];
    return {
      source_type: 'youtube',
      original_url: trimmed,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      validation_status: 'valid',
    };
  }

  try {
    const parsed = new URL(trimmed);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { source_type: 'image', original_url: trimmed, thumbnail_url: '', validation_status: 'invalid' };
    }

    const hasImageExtension = ALLOWED_IMAGE_EXTENSIONS.some(ext =>
      parsed.pathname.toLowerCase().endsWith(ext)
    );

    if (parsed.hostname.includes('cloudinary.com')) {
      return {
        source_type: 'cloudinary',
        original_url: trimmed,
        thumbnail_url: trimmed,
        validation_status: 'valid',
      };
    }

    if (hasImageExtension || parsed.hostname.includes('pexels.com') || parsed.hostname.includes('unsplash.com') || parsed.hostname.includes('githubusercontent.com') || parsed.hostname.includes('images.')) {
      return {
        source_type: 'image',
        original_url: trimmed,
        thumbnail_url: trimmed,
        validation_status: 'valid',
      };
    }

    return {
      source_type: 'image',
      original_url: trimmed,
      thumbnail_url: trimmed,
      validation_status: 'pending',
    };
  } catch {
    return { source_type: 'image', original_url: trimmed, thumbnail_url: '', validation_status: 'invalid' };
  }
}

export const PLACEHOLDER_IMAGE = 'https://images.pexels.com/photos/5632392/pexels-photo-5632392.jpeg?auto=compress&cs=tinysrgb&w=400';

export function getDisplayThumbnail(media?: { thumbnail_url?: string; source_type?: string } | null): string {
  if (!media?.thumbnail_url) return PLACEHOLDER_IMAGE;
  return media.thumbnail_url || PLACEHOLDER_IMAGE;
}
