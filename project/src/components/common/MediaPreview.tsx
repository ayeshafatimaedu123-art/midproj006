import { useState } from 'react';
import { Play, Image } from 'lucide-react';
import { PLACEHOLDER_IMAGE } from '../../lib/mediaUtils';
import { AdMedia } from '../../types';

interface Props {
  media?: AdMedia[];
  className?: string;
}

export default function MediaPreview({ media, className = '' }: Props) {
  const [selected, setSelected] = useState(0);
  const [imgError, setImgError] = useState<Record<number, boolean>>({});

  const items = media?.filter(m => m.validation_status !== 'invalid') ?? [];
  const primary = items[selected] ?? items[0];

  if (!primary) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center rounded-lg ${className}`}>
        <div className="text-center text-gray-400">
          <Image className="w-12 h-12 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No media</p>
        </div>
      </div>
    );
  }

  const displayUrl = imgError[selected] ? PLACEHOLDER_IMAGE : (primary.thumbnail_url || PLACEHOLDER_IMAGE);

  return (
    <div className={className}>
      <div className="relative rounded-lg overflow-hidden bg-gray-100 aspect-video">
        {primary.source_type === 'youtube' && !imgError[selected] ? (
          <div className="relative w-full h-full">
            <img
              src={displayUrl}
              alt="Video thumbnail"
              className="w-full h-full object-cover"
              onError={() => setImgError(p => ({ ...p, [selected]: true }))}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <a
                href={primary.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 bg-opacity-90 rounded-full p-4 hover:bg-opacity-100 transition"
              >
                <Play className="w-8 h-8 text-white fill-white" />
              </a>
            </div>
          </div>
        ) : (
          <img
            src={displayUrl}
            alt="Ad media"
            className="w-full h-full object-cover"
            onError={() => setImgError(p => ({ ...p, [selected]: true }))}
          />
        )}
      </div>
      {items.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {items.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition ${
                i === selected ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <img
                src={item.thumbnail_url || PLACEHOLDER_IMAGE}
                alt={`Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
                onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
