'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '@/components/ui/Card';
import { Bill, MemberSummary } from '@/types';
import { formatCurrency } from '@/lib/calculations';

interface AnalyticsProps {
  bill: Bill;
  summaries: MemberSummary[];
}

const COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];

export default function Analytics({ bill, summaries }: AnalyticsProps) {
  // Pie Chart Data - Spending by person
  const spendingData = summaries.map((summary) => {
    const member = bill.members.find((m) => m.id === summary.memberId);
    return {
      name: member?.name || 'Unknown',
      value: summary.totalPaid,
    };
  }).filter(d => d.value > 0);

  // Bar Chart Data - Paid vs Should Pay
  const comparisonData = summaries.map((summary) => {
    const member = bill.members.find((m) => m.id === summary.memberId);
    return {
      name: member?.name || 'Unknown',
      paid: summary.totalPaid,
      shouldPay: summary.totalShared,
    };
  });

  // Smart Insights
  const topSpender = summaries.reduce((max, s) => s.totalPaid > max.totalPaid ? s : max, summaries[0]);
  const topEater = summaries.reduce((max, s) => s.totalShared > max.totalShared ? s : max, summaries[0]);
  const topSpenderMember = bill.members.find((m) => m.id === topSpender?.memberId);
  const topEaterMember = bill.members.find((m) => m.id === topEater?.memberId);

  const totalAmount = bill.items.reduce((sum, item) => sum + item.price, 0);
  const equalSplit = totalAmount / bill.members.length;
  const totalSaved = summaries.reduce((sum, s) => {
    const saved = Math.abs(equalSplit - s.totalShared);
    return sum + saved;
  }, 0);

  const mostSharedItem = bill.items.reduce((max, item) =>
    item.sharedBy.length > max.sharedBy.length ? item : max,
    bill.items[0]
  );

  return (
    <div className="space-y-6">
      {/* Smart Insights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-xs font-medium">🏆 Top Spender</p>
              <p className="text-xl font-bold mt-1">{topSpenderMember?.name}</p>
              <p className="text-sm text-emerald-100 mt-1">{formatCurrency(topSpender?.totalPaid || 0)}</p>
            </div>
            <div className="text-4xl opacity-80">💰</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs font-medium">🍽️ Top Eater</p>
              <p className="text-xl font-bold mt-1">{topEaterMember?.name}</p>
              <p className="text-sm text-amber-100 mt-1">{formatCurrency(topEater?.totalShared || 0)}</p>
            </div>
            <div className="text-4xl opacity-80">🍔</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-cyan-100 text-xs font-medium">⭐ Most Shared</p>
              <p className="text-xl font-bold mt-1 truncate">{mostSharedItem?.name}</p>
              <p className="text-sm text-cyan-100 mt-1">{mostSharedItem?.sharedBy.length} people</p>
            </div>
            <div className="text-4xl opacity-80">🎯</div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-xs font-medium">💎 Total Saved</p>
              <p className="text-xl font-bold mt-1">{formatCurrency(totalSaved)}</p>
              <p className="text-sm text-purple-100 mt-1">vs equal split</p>
            </div>
            <div className="text-4xl opacity-80">✨</div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <Card className="shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Spending Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={spendingData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {spendingData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Bar Chart */}
        <Card className="shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Paid vs Should Pay</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value as number)} />
              <Legend />
              <Bar dataKey="paid" fill="#10b981" name="Paid" />
              <Bar dataKey="shouldPay" fill="#06b6d4" name="Should Pay" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
