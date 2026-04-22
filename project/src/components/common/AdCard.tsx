import { Link } from '../../lib/router';
import { MapPin, Eye, Star, Tag } from 'lucide-react';
import { Ad } from '../../types';
import { PLACEHOLDER_IMAGE } from '../../lib/mediaUtils';

interface Props {
  ad: Ad;
  compact?: boolean;
}

export default function AdCard({ ad, compact = false }: Props) {
  const primaryMedia = ad.ad_media?.find(m => m.is_primary) ?? ad.ad_media?.[0];
  const thumbnail = primaryMedia?.thumbnail_url || PLACEHOLDER_IMAGE;
  const packageName = ad.packages?.name;

  const packageStyles: Record<string, { badge: string; glow: boolean }> = {
    Premium: { badge: 'bg-amber-50 text-amber-700 border-amber-200', glow: true },
    Standard: { badge: 'bg-blue-50 text-blue-700 border-blue-200', glow: false },
    Basic: { badge: 'bg-gray-100 text-gray-500 border-gray-200', glow: false },
  };

  const pkgStyle = packageName ? (packageStyles[packageName] ?? packageStyles.Basic) : null;

  return (
    <Link to={`/ads/${ad.slug || ad.id}`} className="group block">
      <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 ${
        ad.is_featured
          ? 'border-amber-200 shadow-md hover:shadow-lg ring-1 ring-amber-100'
          : 'border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200'
      }`}>
        <div className="relative overflow-hidden bg-gray-100" style={{ paddingTop: compact ? '56.25%' : '60%', position: 'relative' }}>
          <img
            src={thumbnail}
            alt={ad.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            onError={e => { (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

          {ad.is_featured && (
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-amber-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-sm">
              <Star className="w-3 h-3 fill-white" />
              Featured
            </div>
          )}

          {pkgStyle && packageName && (
            <div className={`absolute top-2.5 right-2.5 text-xs font-semibold px-2 py-0.5 rounded-full border ${pkgStyle.badge}`}>
              {packageName}
            </div>
          )}
        </div>

        <div className="p-3.5">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors duration-150 mb-1.5">
            {ad.title}
          </h3>

          {ad.price !== null && ad.price !== undefined ? (
            <p className="text-blue-700 font-bold text-base mb-2">
              {ad.price_label || `PKR ${Number(ad.price).toLocaleString()}`}
            </p>
          ) : (
            <p className="text-gray-400 text-sm mb-2 italic">Price negotiable</p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-400">
            {ad.cities && (
              <span className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{ad.cities.name}</span>
              </span>
            )}
            {ad.categories && (
              <span className="flex items-center gap-1 min-w-0">
                <Tag className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{ad.categories.name}</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-gray-50">
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Eye className="w-3 h-3" />
              {ad.views_count ?? 0} views
            </span>
            <span className="text-xs text-gray-400">
              {new Date(ad.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
