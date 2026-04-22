import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '../../lib/router';
import { PlusCircle, Trash2, Image, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Category, City, Package } from '../../types';
import { normalizeMediaUrl } from '../../lib/mediaUtils';
import DashboardLayout from '../../components/layout/DashboardLayout';

export default function CreateAdPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState<Category[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [price, setPrice] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>(['']);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [adId, setAdId] = useState<string | null>(id ?? null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('cities').select('*').eq('is_active', true).order('sort_order'),
      supabase.from('packages').select('*').eq('is_active', true).order('price'),
    ]).then(([cats, cits, pkgs]) => {
      setCategories(cats.data ?? []);
      setCities(cits.data ?? []);
      setPackages(pkgs.data ?? []);
    });

    if (isEdit && id) {
      supabase.from('ads').select('*, ad_media(*)').eq('id', id).maybeSingle()
        .then(({ data }) => {
          if (data) {
            setTitle(data.title ?? '');
            setDescription(data.description ?? '');
            setCategoryId(data.category_id ?? '');
            setCityId(data.city_id ?? '');
            setPrice(data.price?.toString() ?? '');
            setPriceLabel(data.price_label ?? '');
            setContactPhone(data.contact_phone ?? '');
            setContactEmail(data.contact_email ?? '');
            if (data.ad_media?.length) {
              setMediaUrls(data.ad_media.map((m: { original_url: string }) => m.original_url));
            }
          }
        });
    }
  }, [id, isEdit]);

  const generateSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

  const saveAsDraft = async () => {
    if (!title.trim() || !user) return;
    setSaving(true);
    setError('');

    const payload = {
      user_id: user.id,
      title: title.trim(),
      slug: generateSlug(title),
      description: description.trim(),
      category_id: categoryId || null,
      city_id: cityId || null,
      price: price ? parseFloat(price) : null,
      price_label: priceLabel.trim(),
      contact_phone: contactPhone.trim(),
      contact_email: contactEmail.trim(),
      status: 'draft' as const,
    };

    let savedId = adId;
    if (adId) {
      await supabase.from('ads').update(payload).eq('id', adId);
    } else {
      const { data, error } = await supabase.from('ads').insert(payload).select().single();
      if (error) { setError(error.message); setSaving(false); return; }
      savedId = data.id;
      setAdId(data.id);
    }

    if (savedId) {
      await supabase.from('ad_media').delete().eq('ad_id', savedId);
      const validUrls = mediaUrls.filter(u => u.trim());
      if (validUrls.length > 0) {
        const mediaRows = validUrls.map((url, i) => {
          const normalized = normalizeMediaUrl(url);
          return {
            ad_id: savedId,
            source_type: normalized.source_type,
            original_url: normalized.original_url,
            thumbnail_url: normalized.thumbnail_url,
            validation_status: normalized.validation_status,
            is_primary: i === 0,
            sort_order: i,
          };
        });
        await supabase.from('ad_media').insert(mediaRows);
      }
    }

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    await saveAsDraft();

    if (adId) {
      await supabase.from('ads').update({ status: 'submitted' }).eq('id', adId);
      await supabase.from('ad_status_history').insert({
        ad_id: adId, previous_status: 'draft', new_status: 'submitted',
        changed_by: user?.id, note: 'Submitted by client',
      });
      await supabase.from('notifications').insert({
        user_id: user?.id, title: 'Ad Submitted!',
        message: `Your ad "${title}" has been submitted for review.`, type: 'success',
      });
      navigate('/dashboard/my-ads');
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout title={isEdit ? 'Edit Ad' : 'Post New Ad'}>
      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {saved && (
            <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Draft saved successfully
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg">Ad Details</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="e.g., Honda Civic 2020 For Sale"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe your item in detail..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
                <select
                  value={cityId}
                  onChange={e => setCityId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Select city</option>
                  {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (PKR)</label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="e.g., 500000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price Label (optional)</label>
                <input
                  type="text"
                  value={priceLabel}
                  onChange={e => setPriceLabel(e.target.value)}
                  placeholder="e.g., Negotiable"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900 text-lg">Contact Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="+92 300 0000000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="contact@email.com"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Media */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900 text-lg">Media URLs</h2>
              <p className="text-xs text-gray-500 mt-0.5">Add image URLs or YouTube links. No file uploads needed.</p>
            </div>
            <div className="space-y-2">
              {mediaUrls.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <div className="flex-1 relative">
                    <Image className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={url}
                      onChange={e => {
                        const next = [...mediaUrls];
                        next[i] = e.target.value;
                        setMediaUrls(next);
                      }}
                      placeholder="https://example.com/image.jpg or YouTube URL"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  {mediaUrls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setMediaUrls(mediaUrls.filter((_, j) => j !== i))}
                      className="p-2.5 border border-red-200 text-red-500 rounded-xl hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              {mediaUrls.length < 5 && (
                <button
                  type="button"
                  onClick={() => setMediaUrls([...mediaUrls, ''])}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add another URL
                </button>
              )}
            </div>
          </div>

          {/* Packages info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-sm font-medium text-blue-800 mb-2">Package Selection</p>
            <p className="text-xs text-blue-700">
              After submission and content review, you'll be asked to select a package and submit payment.
            </p>
            <div className="mt-3 flex gap-2 flex-wrap">
              {packages.map(pkg => (
                <span key={pkg.id} className="text-xs bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                  {pkg.name}: PKR {pkg.price.toLocaleString()}/{pkg.duration_days}d
                </span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={saveAsDraft}
              disabled={saving || !title.trim()}
              className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 disabled:opacity-50 transition text-sm"
            >
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim()}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition text-sm"
            >
              {submitting ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
