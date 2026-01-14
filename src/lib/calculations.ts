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
 * คำนวณ transactions แบบ Net Settlement Optimization (Greedy Algorithm)
 * หลักการ: คำนวณยอด Balance สุทธิของทุกคน แล้วจับคู่ลูกหนี้กับเจ้าหนี้
 * เพื่อให้เกิดจำนวน Transaction น้อยที่สุด (Minimize Transactions)
 */
export function calculateTransactions(summaries: MemberSummary[], _bill?: Bill): Transaction[] {
  const transactions: Transaction[] = [];

  // 1. แยกกลุ่มลูกหนี้ (Debtors) และเจ้าหนี้ (Creditors)
  // กรองเฉพาะคนที่มีเศษทศนิยมมากกว่า 0.01 เพื่อป้องกัน floating point error
  let debtors = summaries
    .filter((s) => s.balance < -0.01)
    .map((s) => ({ ...s, balance: s.balance })) // clone object
    .sort((a, b) => a.balance - b.balance); // เรียงจากติดลบมาก -> น้อย (Ascending)

  let creditors = summaries
    .filter((s) => s.balance > 0.01)
    .map((s) => ({ ...s, balance: s.balance })) // clone object
    .sort((a, b) => b.balance - a.balance); // เรียงจากบวกมาก -> น้อย (Descending)

  // 2. จับคู่ล้างหนี้ (Greedy Matching)
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];

    // หาจำนวนเงินที่ต้องเคลียร์กัน (ขั้นต่ำระหว่าง "หนี้ที่ A มี" กับ "เงินที่ B ต้องได้")
    const amount = Math.min(Math.abs(debtor.balance), creditor.balance);

    // สร้าง Transaction
    if (amount > 0) {
      transactions.push({
        from: debtor.memberId,
        fromName: debtor.memberName,
        to: creditor.memberId,
        toName: creditor.memberName,
        amount: Math.round(amount * 100) / 100,
      });
    }

    // หักลบยอดคงเหลือ
    debtor.balance += amount;
    creditor.balance -= amount;

    // ตรวจสอบว่าใครเคลียร์ยอดหมดแล้ว ให้ขยับ index
    // ใช้ 0.01 เป็น threshold สำหรับ floating point comparison
    if (Math.abs(debtor.balance) < 0.01) {
      debtorIndex++;
    }

    if (creditor.balance < 0.01) {
      creditorIndex++;
    }
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
