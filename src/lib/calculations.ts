import { Bill, BillItem, MemberSummary, Transaction } from '@/types';

/**
 * คำนวณสรุปยอดเงินของแต่ละสมาชิก
 */
export function calculateMemberSummaries(bill: Bill): MemberSummary[] {
  const summaries: Record<string, MemberSummary> = {};

  // Initialize summaries for all members
  bill.members.forEach((member) => {
    summaries[member.id] = {
      memberId: member.id,
      memberName: member.name,
      totalShared: 0,
      totalPaid: 0,
      balance: 0,
    };
  });

  // Calculate for each item
  bill.items.forEach((item) => {
    const sharedCount = item.sharedBy.length;
    if (sharedCount === 0) return;

    const pricePerPerson = item.price / sharedCount;

    // Add shared amount to each person
    item.sharedBy.forEach((memberId) => {
      if (summaries[memberId]) {
        summaries[memberId].totalShared += pricePerPerson;
      }
    });

    // Add paid amount to each payer
    item.paidBy.forEach((memberId) => {
      if (summaries[memberId]) {
        // ถ้ามี paidAmounts ให้ใช้จากนั้น ไม่งั้นหารเท่าๆกัน
        const paidAmount = item.paidAmounts?.[memberId] ?? item.price / item.paidBy.length;
        summaries[memberId].totalPaid += paidAmount;
      }
    });
  });

  // Calculate balance (positive = ได้เงิน, negative = ต้องจ่าย)
  Object.values(summaries).forEach((summary) => {
    summary.balance = summary.totalPaid - summary.totalShared;
  });

  return Object.values(summaries);
}

/**
 * คำนวณ transactions ที่ง่ายที่สุดในการจ่ายเงินกัน
 * ใช้ algorithm แบบ greedy
 */
export function calculateTransactions(summaries: MemberSummary[]): Transaction[] {
  const transactions: Transaction[] = [];

  // แยกคนที่ต้องจ่ายและคนที่ต้องได้รับ
  const debtors = summaries
    .filter((s) => s.balance < -0.01) // ติดลบ = ต้องจ่าย
    .map((s) => ({ ...s, balance: -s.balance }))
    .sort((a, b) => b.balance - a.balance);

  const creditors = summaries
    .filter((s) => s.balance > 0.01) // ติดบวก = ต้องได้รับ
    .map((s) => ({ ...s }))
    .sort((a, b) => b.balance - a.balance);

  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const amount = Math.min(debtor.balance, creditor.balance);

    if (amount > 0.01) {
      transactions.push({
        from: debtor.memberId,
        fromName: debtor.memberName,
        to: creditor.memberId,
        toName: creditor.memberName,
        amount: Math.round(amount * 100) / 100, // round to 2 decimal places
      });
    }

    debtor.balance -= amount;
    creditor.balance -= amount;

    if (debtor.balance < 0.01) i++;
    if (creditor.balance < 0.01) j++;
  }

  return transactions;
}

/**
 * สร้าง unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * สร้าง admin ID แบบสั้นและจำง่าย
 */
export function generateAdminCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ไม่มี I, O, 0, 1 เพื่อป้องกันสับสน
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Format currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * สร้างสีสำหรับสมาชิกแต่ละคน
 */
const MEMBER_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
  '#6366F1', // indigo
  '#84CC16', // lime
];

export function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}
