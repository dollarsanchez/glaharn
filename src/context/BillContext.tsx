'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Bill, BillItem, Member, ItemRequest, Comment, PaymentMethod } from '@/types';
import { generateId } from '@/lib/calculations';
import { billAPI } from '@/lib/supabase';

interface BillContextType {
  bills: Record<string, Bill>;
  currentBill: Bill | null;
  isLoading: boolean;
  loadBill: (billId: string) => Promise<void>;
  createBill: (name: string, adminId: string, location?: string, eventDate?: Date) => Promise<Bill>;
  updateBill: (billId: string, updates: Partial<Bill>) => Promise<void>;
  addMember: (billId: string, member: Member) => Promise<void>;
  updateMember: (billId: string, memberId: string, updates: Partial<Member>) => Promise<void>;
  removeMember: (billId: string, memberId: string) => Promise<void>;
  addItem: (billId: string, item: BillItem) => Promise<void>;
  updateItem: (billId: string, itemId: string, updates: Partial<BillItem>) => Promise<void>;
  removeItem: (billId: string, itemId: string) => Promise<void>;
  addPaymentMethod: (billId: string, method: PaymentMethod) => Promise<void>;
  removePaymentMethod: (billId: string, index: number) => Promise<void>;
  addRequest: (billId: string, request: ItemRequest) => Promise<void>;
  updateRequest: (billId: string, requestId: string, updates: Partial<ItemRequest>) => Promise<void>;
  addComment: (billId: string, comment: Comment) => Promise<void>;
  updateComment: (billId: string, commentId: string, adminReply: string) => Promise<void>;
}

const BillContext = createContext<BillContextType | undefined>(undefined);

const STORAGE_KEY = 'glaharn_bills';

export function BillProvider({ children }: { children: ReactNode }) {
  const [bills, setBills] = useState<Record<string, Bill>>({});
  const [currentBill, setCurrentBill] = useState<Bill | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load bills from localStorage on mount (as fallback/cache)
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

  // Save bills to localStorage whenever they change (as cache)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
    } catch (error) {
      console.error('Failed to save bills to localStorage:', error);
    }
  }, [bills]);

  const loadBill = async (billId: string) => {
    setIsLoading(true);
    try {
      // Try to get from Supabase first
      const bill = await billAPI.getBill(billId);
      if (bill) {
        setBills((prev) => ({ ...prev, [billId]: bill }));
        setCurrentBill(bill);
      } else {
        // Fallback to localStorage cache
        const cachedBill = bills[billId];
        if (cachedBill) {
          setCurrentBill(cachedBill);
        }
      }
    } catch (error) {
      console.error('Error loading bill:', error);
      // Fallback to localStorage
      const cachedBill = bills[billId];
      if (cachedBill) {
        setCurrentBill(cachedBill);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createBill = async (name: string, adminId: string, location?: string, eventDate?: Date): Promise<Bill> => {
    const billId = generateId();
    const newBill: Bill = {
      id: billId,
      name,
      location,
      eventDate,
      adminId,
      createdAt: new Date(),
      members: [],
      items: [],
      paymentMethods: [],
      requests: [],
      comments: [],
    };

    // Save to local state first
    setBills((prev) => ({ ...prev, [billId]: newBill }));
    setCurrentBill(newBill);

    // Save to Supabase
    try {
      await billAPI.createBill(newBill);
    } catch (error) {
      console.error('Error creating bill in Supabase:', error);
    }

    return newBill;
  };

  const updateBill = async (billId: string, updates: Partial<Bill>) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = { ...prev[billId], ...updates };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }

      // Save to Supabase
      billAPI.updateBill(updated).catch((error) => {
        console.error('Error updating bill in Supabase:', error);
      });

      return { ...prev, [billId]: updated };
    });
  };

  const addMember = async (billId: string, member: Member) => {
    const currentBillData = bills[billId];
    if (!currentBillData) return;

    const updated = {
      ...currentBillData,
      members: [...currentBillData.members, member],
    };

    // Optimistic update - update local state immediately
    setBills((prev) => ({ ...prev, [billId]: updated }));
    if (currentBill?.id === billId) {
      setCurrentBill(updated);
    }

    // Sync to Supabase in background (non-blocking)
    try {
      await billAPI.updateBill(updated);
    } catch (error) {
      console.error('Error syncing to Supabase (data saved locally):', error);
      // Don't throw - we already updated local state
    }
  };

  const updateMember = async (billId: string, memberId: string, updates: Partial<Member>) => {
    const currentBillData = bills[billId];
    if (!currentBillData) return;

    const updated = {
      ...currentBillData,
      members: currentBillData.members.map((m) =>
        m.id === memberId ? { ...m, ...updates } : m
      ),
    };

    // Optimistic update - update local state immediately
    setBills((prev) => ({ ...prev, [billId]: updated }));
    if (currentBill?.id === billId) {
      setCurrentBill(updated);
    }

    // Sync to Supabase in background (non-blocking)
    try {
      await billAPI.updateBill(updated);
    } catch (error) {
      console.error('Error syncing to Supabase (data saved locally):', error);
    }
  };

  const removeMember = async (billId: string, memberId: string) => {
    const currentBillData = bills[billId];
    if (!currentBillData) return;

    const updated = {
      ...currentBillData,
      members: currentBillData.members.filter((m) => m.id !== memberId),
      items: currentBillData.items.map((item) => ({
        ...item,
        paidBy: item.paidBy.filter((id) => id !== memberId),
        sharedBy: item.sharedBy.filter((id) => id !== memberId),
      })),
    };

    // Optimistic update - update local state immediately
    setBills((prev) => ({ ...prev, [billId]: updated }));
    if (currentBill?.id === billId) {
      setCurrentBill(updated);
    }

    // Sync to Supabase in background (non-blocking)
    try {
      await billAPI.updateBill(updated);
    } catch (error) {
      console.error('Error syncing to Supabase (data saved locally):', error);
    }
  };

  const addItem = async (billId: string, item: BillItem) => {
    const currentBillData = bills[billId];
    if (!currentBillData) return;

    const updated = {
      ...currentBillData,
      items: [...currentBillData.items, item],
    };

    // Optimistic update - update local state immediately
    setBills((prev) => ({ ...prev, [billId]: updated }));
    if (currentBill?.id === billId) {
      setCurrentBill(updated);
    }

    // Sync to Supabase in background (non-blocking)
    try {
      await billAPI.updateBill(updated);
    } catch (error) {
      console.error('Error syncing to Supabase (data saved locally):', error);
    }
  };

  const updateItem = async (billId: string, itemId: string, updates: Partial<BillItem>) => {
    const currentBillData = bills[billId];
    if (!currentBillData) return;

    const updated = {
      ...currentBillData,
      items: currentBillData.items.map((item) =>
        item.id === itemId ? { ...item, ...updates } : item
      ),
    };

    // Optimistic update - update local state immediately
    setBills((prev) => ({ ...prev, [billId]: updated }));
    if (currentBill?.id === billId) {
      setCurrentBill(updated);
    }

    // Sync to Supabase in background (non-blocking)
    try {
      await billAPI.updateBill(updated);
    } catch (error) {
      console.error('Error syncing to Supabase (data saved locally):', error);
    }
  };

  const removeItem = async (billId: string, itemId: string) => {
    const currentBillData = bills[billId];
    if (!currentBillData) return;

    const updated = {
      ...currentBillData,
      items: currentBillData.items.filter((item) => item.id !== itemId),
    };

    // Optimistic update - update local state immediately
    setBills((prev) => ({ ...prev, [billId]: updated }));
    if (currentBill?.id === billId) {
      setCurrentBill(updated);
    }

    // Sync to Supabase in background (non-blocking)
    try {
      await billAPI.updateBill(updated);
    } catch (error) {
      console.error('Error syncing to Supabase (data saved locally):', error);
    }
  };

  const addPaymentMethod = async (billId: string, method: PaymentMethod) => {
    const currentBillData = bills[billId];
    if (!currentBillData) return;

    const updated = {
      ...currentBillData,
      paymentMethods: [...currentBillData.paymentMethods, method],
    };

    // Optimistic update - update local state immediately
    setBills((prev) => ({ ...prev, [billId]: updated }));
    if (currentBill?.id === billId) {
      setCurrentBill(updated);
    }

    // Sync to Supabase in background (non-blocking)
    try {
      await billAPI.updateBill(updated);
    } catch (error) {
      console.error('Error syncing to Supabase (data saved locally):', error);
    }
  };

  const removePaymentMethod = async (billId: string, index: number) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        paymentMethods: prev[billId].paymentMethods.filter((_, i) => i !== index),
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }

      // Save to Supabase
      billAPI.updateBill(updated).catch((error) => {
        console.error('Error updating bill in Supabase:', error);
      });

      return { ...prev, [billId]: updated };
    });
  };

  const addRequest = async (billId: string, request: ItemRequest) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        requests: [...prev[billId].requests, request],
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }

      // Save to Supabase
      billAPI.updateBill(updated).catch((error) => {
        console.error('Error updating bill in Supabase:', error);
      });

      return { ...prev, [billId]: updated };
    });
  };

  const updateRequest = async (billId: string, requestId: string, updates: Partial<ItemRequest>) => {
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

      // Save to Supabase
      billAPI.updateBill(updated).catch((error) => {
        console.error('Error updating bill in Supabase:', error);
      });

      return { ...prev, [billId]: updated };
    });
  };

  const addComment = async (billId: string, comment: Comment) => {
    setBills((prev) => {
      if (!prev[billId]) return prev;
      const updated = {
        ...prev[billId],
        comments: [...prev[billId].comments, comment],
      };
      if (currentBill?.id === billId) {
        setCurrentBill(updated);
      }

      // Save to Supabase
      billAPI.updateBill(updated).catch((error) => {
        console.error('Error updating bill in Supabase:', error);
      });

      return { ...prev, [billId]: updated };
    });
  };

  const updateComment = async (billId: string, commentId: string, adminReply: string) => {
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

      // Save to Supabase
      billAPI.updateBill(updated).catch((error) => {
        console.error('Error updating bill in Supabase:', error);
      });

      return { ...prev, [billId]: updated };
    });
  };

  return (
    <BillContext.Provider
      value={{
        bills,
        currentBill,
        isLoading,
        loadBill,
        createBill,
        updateBill,
        addMember,
        updateMember,
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
