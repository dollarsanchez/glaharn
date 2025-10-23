import { createClient } from '@supabase/supabase-js';
import { Bill } from '@/types';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface BillRow {
  id: string;
  name: string;
  admin_id: string;
  created_at: string;
  data: any; // JSONB field
}

// Helper functions
export const billAPI = {
  // Get bill by ID
  async getBill(billId: string): Promise<Bill | null> {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', billId)
      .single();

    if (error || !data) {
      console.error('Error fetching bill:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      adminId: data.admin_id,
      createdAt: new Date(data.created_at),
      ...data.data,
    };
  },

  // Create new bill
  async createBill(bill: Bill): Promise<boolean> {
    const { members, items, paymentMethods, requests, comments } = bill;

    console.log('🔵 Attempting to create bill in Supabase:', {
      billId: bill.id,
      billName: bill.name,
      supabaseUrl: supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    });

    const { data, error } = await supabase.from('bills').insert({
      id: bill.id,
      name: bill.name,
      admin_id: bill.adminId,
      created_at: bill.createdAt.toISOString(),
      data: {
        members,
        items,
        paymentMethods,
        requests,
        comments,
      },
    });

    if (error) {
      console.error('❌ Error creating bill:', error);
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return false;
    }

    console.log('✅ Bill created successfully in Supabase!', data);
    return true;
  },

  // Update bill
  async updateBill(bill: Bill): Promise<boolean> {
    const { members, items, paymentMethods, requests, comments } = bill;

    const { error } = await supabase
      .from('bills')
      .update({
        name: bill.name,
        admin_id: bill.adminId,
        data: {
          members,
          items,
          paymentMethods,
          requests,
          comments,
        },
      })
      .eq('id', bill.id);

    if (error) {
      console.error('Error updating bill:', error);
      return false;
    }

    return true;
  },

  // Delete bill
  async deleteBill(billId: string): Promise<boolean> {
    const { error } = await supabase.from('bills').delete().eq('id', billId);

    if (error) {
      console.error('Error deleting bill:', error);
      return false;
    }

    return true;
  },

  // Get all bills (for admin/dashboard)
  async getAllBills(): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('Error fetching bills:', error);
      return [];
    }

    return data.map((row) => ({
      id: row.id,
      name: row.name,
      adminId: row.admin_id,
      createdAt: new Date(row.created_at),
      ...row.data,
    }));
  },
};
