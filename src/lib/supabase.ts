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
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('id', billId)
        .single();

      if (error || !data) {
        console.log('Bill not found in Supabase, will use localStorage fallback');
        return null;
      }

      return {
        id: data.id,
        name: data.name,
        adminId: data.admin_id,
        createdAt: new Date(data.created_at),
        ...data.data,
      };
    } catch (err) {
      console.log('Supabase connection issue, will use localStorage fallback');
      return null;
    }
  },

  // Create new bill
  async createBill(bill: Bill): Promise<boolean> {
    try {
      const { members, items, paymentMethods, requests, comments, paymentMethodRequests, location, eventDate, optOutDeadline } = bill;

      console.log('🔵 Attempting to create bill in Supabase:', {
        billId: bill.id,
        billName: bill.name,
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
          paymentMethodRequests: paymentMethodRequests || [],
          location,
          eventDate: eventDate ? eventDate.toISOString() : null,
          optOutDeadline: optOutDeadline ? optOutDeadline.toISOString() : null,
        },
      });

      if (error) {
        console.log('Supabase create skipped (using localStorage):', error.message);
        return true; // Return true because data is saved in localStorage
      }

      console.log('✅ Bill created successfully in Supabase!', data);
      return true;
    } catch (err) {
      console.log('Supabase connection issue (using localStorage fallback)');
      return true; // Return true because data is saved in localStorage
    }
  },

  // Update bill
  async updateBill(bill: Bill): Promise<boolean> {
    try {
      const { members, items, paymentMethods, requests, comments, paymentMethodRequests, location, eventDate, optOutDeadline } = bill;

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
            paymentMethodRequests: paymentMethodRequests || [],
            location,
            eventDate: eventDate ? eventDate.toISOString() : null,
            optOutDeadline: optOutDeadline ? optOutDeadline.toISOString() : null,
          },
        })
        .eq('id', bill.id);

      if (error) {
        console.log('Supabase update skipped (using localStorage):', error.message);
        return true; // Return true because data is saved in localStorage
      }

      console.log('✅ Bill updated in Supabase successfully');
      return true;
    } catch (err) {
      console.log('Supabase connection issue (using localStorage fallback)');
      return true; // Return true because data is saved in localStorage
    }
  },

  // Delete bill
  async deleteBill(billId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('bills').delete().eq('id', billId);

      if (error) {
        console.log('Supabase delete skipped (using localStorage):', error.message);
        return true; // Return true because data is deleted from localStorage
      }

      console.log('✅ Bill deleted from Supabase successfully');
      return true;
    } catch (err) {
      console.log('Supabase connection issue (using localStorage fallback)');
      return true; // Return true because data is deleted from localStorage
    }
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
