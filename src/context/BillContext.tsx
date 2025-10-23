'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Bill, BillItem, Member, ItemRequest, Comment, PaymentMethod } from '@/types';
import { generateId } from '@/lib/calculations';

interface BillContextType {
  bills: Record<string, Bill>;
  currentBill: Bill | null;
  loadBill: (billId: string) => void;
  createBill: (name: string, adminId: string) => Bill;
  updateBill: (billId: string, updates: Partial<Bill>) => void;
  addMember: (billId: string, member: Member) => void;
  removeMember: (billId: string, memberId: string) => void;
  addItem: (billId: string, item: BillItem) => void;
  updateItem: (billId: string, itemId: string, updates: Partial<BillItem>) => void;
  removeItem: (billId: string, itemId: string) => void;
  addPaymentMethod: (billId: string, method: PaymentMethod) => void;
  removePaymentMethod: (billId: string, index: number) => void;
  addRequest: (billId: string, request: ItemRequest) => void;
  updateRequest: (billId: string, requestId: string, updates: Partial<ItemRequest>) => void;
  addComment: (billId: string, comment: Comment) => void;
  updateComment: (billId: string, commentId: string, adminReply: string) => void;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

const STORAGE_KEY = 'glaharn_bills';

export function BillProvider({ children }: { children: ReactNode }) {
  const [bills, setBills] = useState<Record<string, Bill>>({});
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);

  // Load bills from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        Object.values(parsed).forEach((bill: any) => {
          bill.createdAt = new Date(bill.createdAt);
          bill.requests?.forEach((req: any) => {
            req.createdAt = new Date(req.createdAt);
          });
          bill.comments?.forEach((comment: any) => {
            comment.createdAt = new Date(comment.createdAt);
          });
        });
        setBills(parsed);
      }
    } catch (error) {
      console.error('Failed to load bills from localStorage:', error);
    }
  }, []);

  // Save bills to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    } catch (error) {
      console.error('Failed to save bills to localStorage:', error);
    }
  }, [bills]);

  const loadBill = (billId: string) => {
    const bill = bills[billId];
    if (bill) {
      setCurrentBill(bill);
    }
  };

  const createBill = (name: string, adminId: string): Bill => {
    const billId = generateId();
    const newBill: Bill = {
      id: billId,
      name,
      adminId,
      createdAt: new Date(),
      members: [],
      items: [],
      paymentMethods: [],
      requests: [],
      comments: [],
    };

    setBills((prev) => ({ ...prev, [billId]: newBill }));
    setCurrentBill(newBill);
    return newBill;
  };

  const updateBill = (billId: string, updates: Partial<Bill>) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = { ...prev[billId], ...updates };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const addMember = (billId: string, member: Member) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        members: [...prev[billId].members, member],
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const removeMember = (billId: string, memberId: string) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        members: prev[billId].members.filter((m) => m.id !== memberId),
        items: prev[billId].items.map((item) => ({
          ...item,
          paidBy: item.paidBy.filter((id) => id !== memberId),
          sharedBy: item.sharedBy.filter((id) => id !== memberId),
        })),
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const addItem = (billId: string, item: BillItem) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        items: [...prev[billId].items, item],
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const updateItem = (billId: string, itemId: string, updates: Partial<BillItem>) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        items: prev[billId].items.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const removeItem = (billId: string, itemId: string) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        items: prev[billId].items.filter((item) => item.id !== itemId),
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const addPaymentMethod = (billId: string, method: PaymentMethod) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        paymentMethods: [...prev[billId].paymentMethods, method],
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const removePaymentMethod = (billId: string, index: number) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        paymentMethods: prev[billId].paymentMethods.filter((_, i) => i !== index),
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const addRequest = (billId: string, request: ItemRequest) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        requests: [...prev[billId].requests, request],
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const updateRequest = (billId: string, requestId: string, updates: Partial<ItemRequest>) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        requests: prev[billId].requests.map((req) =>
          req.id === requestId ? { ...req, ...updates } : req
        ),
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const addComment = (billId: string, comment: Comment) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        comments: [...prev[billId].comments, comment],
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  const updateComment = (billId: string, commentId: string, adminReply: string) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        comments: prev[billId].comments.map((comment) =>
          comment.id === commentId ? { ...comment, adminReply } : comment
        ),
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }
      return { ...prev, [billId]: updated };
    });
  };

  return (
    <BillContext.Provider
      value={{
        bills,
        currentBill,
        loadBill,
        createBill,
        updateBill,
        addMember,
        removeMember,
        addItem,
        updateItem,
        removeItem,
        addPaymentMethod,
        removePaymentMethod,
        addRequest,
        updateRequest,
        addComment,
        updateComment,
      }}
    >
      {children}
    </BillContext.Provider>
  );
}

export function useBill() {
  const context = useContext(BillContext);
  if (context === undefined) {
    throw new Error('useBill must be used within a BillProvider');
  }
  return context;
}
