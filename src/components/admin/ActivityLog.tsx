'use client';

import Card from '@/components/ui/Card';
import { Bill } from '@/types';

interface Activity {
  id: string;
  type: 'payment' | 'request' | 'comment' | 'item' | 'member';
  message: string;
  time: string;
  icon: string;
}

interface ActivityLogProps {
  bill: Bill;
}

export default function ActivityLog({ bill }: ActivityLogProps) {
  // Generate activities from bill data
  const activities: Activity[] = [];

  // Payment slips
  bill.members
    .filter(m => m.paymentSlipUrl)
    .forEach(m => {
      activities.push({
        id: `slip-${m.id}`,
        type: 'payment',
        message: `${m.name} uploaded payment slip`,
        time: 'Recently',
        icon: m.paymentVerified ? '✅' : '⏳',
      });
    });

  // Pending requests
  bill.requests
    .filter(r => r.status === 'pending')
    .forEach(r => {
      const member = bill.members.find(m => m.id === r.memberId);
      const item = bill.items.find(i => i.id === r.itemId);
      if (member && item) {
        activities.push({
          id: r.id,
          type: 'request',
          message: `${member.name} requested to opt out from ${item.name}`,
          time: 'Pending',
          icon: '🍽️',
        });
      }
    });

  // Comments
  bill.comments
    .filter(c => !c.adminReply)
    .forEach(c => {
      const member = bill.members.find(m => m.id === c.memberId);
      if (member) {
        activities.push({
          id: c.id,
          type: 'comment',
          message: `${member.name} left a comment`,
          time: 'Unread',
          icon: '💬',
        });
      }
    });

  // Recent items (last 5)
  bill.items
    .slice(-5)
    .reverse()
    .forEach(item => {
      const payer = bill.members.find(m => m.id === item.paidBy[0]);
      if (payer) {
        activities.push({
          id: `item-${item.id}`,
          type: 'item',
          message: `${payer.name} added "${item.name}"`,
          time: 'Recently',
          icon: '🍽️',
        });
      }
    });

  return (
    <Card className="shadow-lg">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p>No recent activity</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.slice(0, 10).map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-2xl flex-shrink-0">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
