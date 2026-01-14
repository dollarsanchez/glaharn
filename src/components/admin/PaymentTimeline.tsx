'use client';

import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { Bill } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface PaymentTimelineProps {
  bill: Bill;
}

export default function PaymentTimeline({ bill }: PaymentTimelineProps) {
  const events = bill.members
    .filter(m => m.paymentSlipUrl || m.paymentVerified)
    .map(m => ({
      id: m.id,
      member: m,
      type: m.paymentVerified ? 'verified' : 'pending',
      time: 'Recently',
    }));

  return (
    <Card className="shadow-lg">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Payment History</h3>

      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">💳</p>
          <p>No payment history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div key={event.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0">
                {event.type === 'verified' ? (
                  <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                    ✓
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    ⏳
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{event.member.name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {event.type === 'verified' ? 'Payment verified' : 'Slip uploaded'}
                </p>
                <p className="text-xs text-gray-500 mt-1">{event.time}</p>
              </div>
              <Badge variant={event.type === 'verified' ? 'success' : 'warning'}>
                {event.type === 'verified' ? 'Verified' : 'Pending'}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
