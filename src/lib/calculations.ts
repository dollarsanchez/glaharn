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
 * คำนวณ transactions แบบ proportional payment
 * แต่ละคนจะจ่ายตามสัดส่วนที่แท้จริงของเมนูที่เขาหาร
 * รวมรายการที่ซ้ำซ้อนเป็นยอดสุทธิ (net transactions)
 */
export function calculateTransactions(summaries: MemberSummary[], bill: Bill): Transaction[] {
  const transactions: Transaction[] = [];
  const transactionMap: Record<string, number> = {}; // key: "fromId->toId", value: amount

  // คำนวณการจ่ายเงินสำหรับแต่ละเมนู
  bill.items.forEach((item) => {
    const sharedCount = item.sharedBy.length;
    if (sharedCount === 0) return;

    const pricePerPerson = item.price / sharedCount;

    // สำหรับแต่ละคนที่หารเมนูนี้
    item.sharedBy.forEach((sharedMemberId) => {
      // สำหรับแต่ละคนที่จ่ายเมนูนี้
      item.paidBy.forEach((paidMemberId) => {
        // ถ้าคนเดียวกัน ไม่ต้องโอน
        if (sharedMemberId === paidMemberId) return;

        // คำนวณจำนวนที่คนนี้จ่ายไปในเมนูนี้
        const paidAmount = item.paidAmounts?.[paidMemberId] ?? item.price / item.paidBy.length;
        // คำนวณสัดส่วนที่ต้องจ่าย
        const proportionToPay = (pricePerPerson / item.price) * paidAmount;

        const key = `${sharedMemberId}->${paidMemberId}`;
        transactionMap[key] = (transactionMap[key] || 0) + proportionToPay;
      });
    });
  });

  // รวมรายการที่ซ้ำซ้อนเป็นยอดสุทธิ (A->B และ B->A)
  const netTransactionMap: Record<string, number> = {};
  const processedPairs = new Set<string>();

  Object.entries(transactionMap).forEach(([key, amount]) => {
    if (amount <= 0.01) return; // ข้ามยอดเล็กน้อย

    const [fromId, toId] = key.split('->');
    const pairKey = [fromId, toId].sort().join('<->'); // สร้าง key ที่ไม่สนใจทิศทาง

    // ถ้าคู่นี้ถูกประมวลผลแล้ว ข้ามไป
    if (processedPairs.has(pairKey)) return;
    processedPairs.add(pairKey);

    // หาจำนวนในทิศทางตรงกันข้าม
    const reverseKey = `${toId}->${fromId}`;
    const reverseAmount = transactionMap[reverseKey] || 0;

    // คำนวณยอดสุทธิ
    const netAmount = amount - reverseAmount;

    if (Math.abs(netAmount) > 0.01) {
      // ถ้า netAmount เป็นบวก แปลว่า fromId ต้องจ่ายให้ toId
      // ถ้า netAmount เป็นลบ แปลว่า toId ต้องจ่ายให้ fromId
      if (netAmount > 0) {
        netTransactionMap[`${fromId}->${toId}`] = netAmount;
      } else {
        netTransactionMap[`${toId}->${fromId}`] = Math.abs(netAmount);
      }
    }
  });

  // แปลง map เป็น array
  Object.entries(netTransactionMap).forEach(([key, amount]) => {
    const [fromId, toId] = key.split('->');
    const fromSummary = summaries.find(s => s.memberId === fromId);
    const toSummary = summaries.find(s => s.memberId === toId);

    if (fromSummary && toSummary) {
      transactions.push({
        from: fromId,
        fromName: fromSummary.memberName,
        to: toId,
        toName: toSummary.memberName,
        amount: Math.round(amount * 100) / 100, // round to 2 decimal places
      });
    }
  });

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
