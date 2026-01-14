'use client';

import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import Badge from '@/components/ui/Badge';
import { Bill, MemberSummary } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface CollectionDashboardProps {
  bill: Bill;
  summaries: MemberSummary[];
}

export default function CollectionDashboard({ bill, summaries }: CollectionDashboardProps) {
  const totalAmount = bill.items.reduce((sum, item) => sum + item.price, 0);

  const verifiedMembers = bill.members.filter(m => m.paymentVerified);
  const pendingMembers = bill.members.filter(m => !m.paymentVerified && m.paymentSlipUrl);
  const notPaidMembers = bill.members.filter(m => !m.paymentSlipUrl);

  const collectedAmount = summaries
    .filter(s => {
      const member = bill.members.find(m => m.id === s.memberId);
      return member?.paymentVerified;
    })
    .reduce((sum, s) => sum + s.totalPaid, 0);

  const pendingAmount = summaries
    .filter(s => {
      const member = bill.members.find(m => m.id === s.memberId);
      return member?.paymentSlipUrl && !member?.paymentVerified;
    })
    .reduce((sum, s) => sum + s.totalPaid, 0);

  const outstandingAmount = totalAmount - collectedAmount - pendingAmount;
  const collectionRate = totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0;

  return (
    <Card className="shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Collection Status</h2>
        <Badge variant={collectionRate === 100 ? 'success' : collectionRate > 50 ? 'warning' : 'danger'}>
          {collectionRate.toFixed(0)}%
        </Badge>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-baseline mb-2">
          <span className="text-sm font-medium text-gray-700">Collected</span>
          <span className="text-2xl font-bold text-emerald-600">
            {formatCurrency(collectedAmount)} / {formatCurrency(totalAmount)}
          </span>
        </div>
        <ProgressBar value={collectedAmount} max={totalAmount} color="emerald" showPercentage={false} />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <p className="text-3xl font-bold text-emerald-600">{verifiedMembers.length}</p>
          <p className="text-xs text-emerald-700 font-medium mt-1">Verified</p>
        </div>

        <div className="text-center p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-3xl font-bold text-amber-600">{pendingMembers.length}</p>
          <p className="text-xs text-amber-700 font-medium mt-1">Pending</p>
        </div>

        <div className="text-center p-3 bg-rose-50 rounded-lg border border-rose-200">
          <p className="text-3xl font-bold text-rose-600">{notPaidMembers.length}</p>
          <p className="text-xs text-rose-700 font-medium mt-1">Not Paid</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">💰 Collected</span>
          <span className="text-sm font-semibold text-emerald-600">{formatCurrency(collectedAmount)}</span>
        </div>

        {pendingAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">⏳ Pending</span>
            <span className="text-sm font-semibold text-amber-600">{formatCurrency(pendingAmount)}</span>
          </div>
        )}

        {outstandingAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">❌ Outstanding</span>
            <span className="text-sm font-semibold text-rose-600">{formatCurrency(outstandingAmount)}</span>
          </div>
        )}
      </div>
    </Card>
  );
}
