// Payment method types
export interface PromptPayInfo {
  type: 'promptpay';
  phoneNumber: string;
  ownerId: string; // member ID ของเจ้าของบัญชี
  ownerName: string; // ชื่อเจ้าของบัญชี
}

export interface QRCodeInfo {
  type: 'qrcode';
  imageUrl: string;
  ownerId: string; // member ID ของเจ้าของบัญชี
  ownerName: string; // ชื่อเจ้าของบัญชี
}

export interface BankAccountInfo {
  type: 'bank';
  bankName: string;
  accountNumber: string;
  accountName: string;
  ownerId: string; // member ID ของเจ้าของบัญชี
  ownerName: string; // ชื่อเจ้าของบัญชี
}

export type PaymentMethod = PromptPayInfo | QRCodeInfo | BankAccountInfo;

// Member type
export interface Member {
  id: string;
  name: string;
  color: string; // สีประจำตัวสำหรับ UI
  paymentSlipUrl?: string; // URL ของสลิปการโอนเงิน (optional)
  paymentVerified?: boolean; // Admin ตรวจสอบการชำระเงินแล้ว (optional)
}

// Item/Menu type
export interface BillItem {
  id: string;
  name: string;
  price: number;
  paidBy: string[]; // member IDs ที่จ่ายเงิน
  sharedBy: string[]; // member IDs ที่หารเมนูนี้
  paidAmounts?: Record<string, number>; // จำนวนที่แต่ละคนจ่าย (optional)
}

// Request type - เมื่อ member ขอไม่หารเมนู
export interface ItemRequest {
  id: string;
  itemId: string;
  memberId: string;
  memberName: string;
  itemName: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminMessage?: string;
  createdAt: Date;
}

// Payment Method Request type - เมื่อ member ขอแก้ไข/เพิ่ม payment method
export interface PaymentMethodRequest {
  id: string;
  memberId: string;
  memberName: string;
  requestType: 'add' | 'edit' | 'delete';
  paymentMethod: PaymentMethod;
  oldPaymentMethodIndex?: number; // สำหรับ edit/delete
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminMessage?: string;
  createdAt: Date;
}

// Comment type
export interface Comment {
  id: string;
  memberId: string;
  memberName: string;
  message: string;
  adminReply?: string;
  createdAt: Date;
}

// Summary calculation types
export interface MemberSummary {
  memberId: string;
  memberName: string;
  totalShared: number; // ยอดรวมที่ต้องหาร
  totalPaid: number; // ยอดรวมที่จ่ายไป
  balance: number; // ยอดรวม (ติดบวก = ต้องได้รับเงิน, ติดลบ = ต้องจ่ายเงิน)
}

export interface Transaction {
  from: string; // member ID
  fromName: string;
  to: string; // member ID
  toName: string;
  amount: number;
}

// Main Bill type
export interface Bill {
  id: string;
  name: string; // ชื่อปาร์ตี้/บิล
  location?: string; // สถานที่
  eventDate?: Date; // วันที่และเวลาของงาน
  adminId: string; // รหัสสำหรับ admin
  createdAt: Date;
  optOutDeadline?: Date | null; // เวลาสิ้นสุดที่สามารถกดไม่หารเมนูได้
  members: Member[];
  items: BillItem[];
  paymentMethods: PaymentMethod[];
  requests: ItemRequest[];
  paymentMethodRequests: PaymentMethodRequest[]; // คำขอแก้ไข payment method
  comments: Comment[];
}

// Local storage data
export interface BillStorage {
  bills: Record<string, Bill>;
}
