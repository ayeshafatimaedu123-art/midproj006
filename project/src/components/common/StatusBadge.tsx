import { AdStatus } from '../../types';

const statusConfig: Record<AdStatus, { label: string; class: string }> = {
  draft: { label: 'Draft', class: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Submitted', class: 'bg-blue-100 text-blue-700' },
  under_review: { label: 'Under Review', class: 'bg-yellow-100 text-yellow-700' },
  payment_pending: { label: 'Payment Pending', class: 'bg-orange-100 text-orange-700' },
  payment_submitted: { label: 'Payment Submitted', class: 'bg-cyan-100 text-cyan-700' },
  payment_verified: { label: 'Payment Verified', class: 'bg-teal-100 text-teal-700' },
  scheduled: { label: 'Scheduled', class: 'bg-sky-100 text-sky-700' },
  published: { label: 'Published', class: 'bg-green-100 text-green-700' },
  expired: { label: 'Expired', class: 'bg-red-100 text-red-700' },
  rejected: { label: 'Rejected', class: 'bg-rose-100 text-rose-700' },
  archived: { label: 'Archived', class: 'bg-gray-100 text-gray-500' },
};

export default function StatusBadge({ status }: { status: AdStatus }) {
  const config = statusConfig[status] ?? { label: status, class: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  );
}
