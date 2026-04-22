import { useEffect, useState } from 'react';
import { useParams, useNavigate } from '../../lib/router';
import { CheckCircle, AlertCircle, Package } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Ad, Package as PkgType } from '../../types';
import DashboardLayout from '../../components/layout/DashboardLayout';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function SubmitPaymentPage() {
  const { adId } = useParams<{ adId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ad, setAd] = useState<Ad | null>(null);
  const [packages, setPackages] = useState<PkgType[]>([]);
  const [selectedPkg, setSelectedPkg] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank_transfer');
  const [txRef, setTxRef] = useState('');
  const [senderName, setSenderName] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!adId) return;
    supabase.from('ads').select('*, packages(*)').eq('id', adId).maybeSingle()
      .then(({ data }) => setAd(data));
    supabase.from('packages').select('*').eq('is_active', true).order('price')
      .then(({ data }) => setPackages(data ?? []));
  }, [adId]);

  const selectedPackage = packages.find(p => p.id === selectedPkg);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || !txRef.trim() || !senderName.trim()) {
      setError('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    setError('');

    const existing = await supabase.from('payments')
      .select('id').eq('transaction_ref', txRef).maybeSingle();
    if (existing.data) {
      setError('Duplicate transaction reference detected');
      setSubmitting(false);
      return;
    }

    await supabase.from('payments').insert({
      ad_id: adId,
      user_id: user?.id,
      amount: parseFloat(amount) || selectedPackage?.price || 0,
      method,
      transaction_ref: txRef,
      sender_name: senderName,
      screenshot_url: screenshotUrl,
      notes,
      status: 'pending',
    });

    await supabase.from('ads').update({
      package_id: selectedPkg,
      status: 'payment_submitted',
    }).eq('id', adId);

    await supabase.from('ad_status_history').insert({
      ad_id: adId, previous_status: 'payment_pending',
      new_status: 'payment_submitted', changed_by: user?.id,
      note: `Payment submitted: ${txRef}`,
    });

    await supabase.from('notifications').insert({
      user_id: user?.id, title: 'Payment Submitted!',
      message: `Your payment for "${ad?.title}" is under verification.`, type: 'info',
    });

    setSuccess(true);
    setTimeout(() => navigate('/dashboard/my-ads'), 2000);
    setSubmitting(false);
  };

  if (!ad) return <DashboardLayout title="Submit Payment"><div className="flex justify-center py-8"><LoadingSpinner /></div></DashboardLayout>;

  return (
    <DashboardLayout title="Submit Payment">
      <div className="max-w-xl">
        {success ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-gray-900">Payment Submitted!</h2>
            <p className="text-gray-500 mt-2">Our team will verify your payment within 24–48 hours.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Ad info */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-blue-900">{ad.title}</p>
              <p className="text-xs text-blue-700 mt-0.5">Select a package to proceed</p>
            </div>

            {/* Package selection */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Select Package *
              </h3>
              <div className="space-y-2">
                {packages.map(pkg => (
                  <label
                    key={pkg.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${
                      selectedPkg === pkg.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="package"
                      value={pkg.id}
                      checked={selectedPkg === pkg.id}
                      onChange={() => { setSelectedPkg(pkg.id); setAmount(pkg.price.toString()); }}
                      className="text-blue-600"
                    />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 text-sm">{pkg.name}</p>
                      <p className="text-xs text-gray-500">{pkg.duration_days} days • {pkg.description.slice(0, 60)}...</p>
                    </div>
                    <span className="font-bold text-blue-700 text-sm">PKR {pkg.price.toLocaleString()}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Payment details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <h3 className="font-semibold text-gray-900">Payment Details</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Method</label>
                <select
                  value={method}
                  onChange={e => setMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="easypaisa">Easypaisa</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction Reference / TID *</label>
                <input
                  type="text"
                  value={txRef}
                  onChange={e => setTxRef(e.target.value)}
                  required
                  placeholder="e.g., TXN-20260419-001"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sender Name *</label>
                <input
                  type="text"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  required
                  placeholder="Name as it appears on receipt"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Screenshot URL (optional)</label>
                <input
                  type="url"
                  value={screenshotUrl}
                  onChange={e => setScreenshotUrl(e.target.value)}
                  placeholder="https://imgur.com/screenshot.jpg"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any additional information..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>
            </div>

            {selectedPackage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm font-semibold text-green-800">
                  Total Due: PKR {selectedPackage.price.toLocaleString()}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  Please transfer the exact amount to avoid delays.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !selectedPkg}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition"
            >
              {submitting ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
