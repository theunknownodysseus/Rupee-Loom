import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  currency: string;
  language: string;
  timezone: string;
  theme: string;
  monthly_income?: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id?: string;
  amount: number;
  description: string;
  date: string;
  payment_method: string;
  receipt_url?: string;
  location?: string;
  tags: string[];
  is_regret: boolean;
  regret_reason?: string;
  regret_intensity?: number;
  created_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface RecurringPayment {
  id: string;
  user_id: string;
  category_id?: string;
  name: string;
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  next_due_date: string;
  is_active: boolean;
  auto_pay: boolean;
  provider?: string;
  last_paid?: string;
  created_at: string;
  category?: Category;
}

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  total_amount: number;
  remaining_amount: number;
  interest_rate?: number;
  emi_amount?: number;
  due_date?: string;
  lender?: string;
  debt_type: 'loan' | 'credit_card' | 'mortgage' | 'other';
  created_at: string;
}

export interface SavingsChallenge {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  start_date: string;
  end_date: string;
  is_completed: boolean;
  challenge_type: 'fixed_amount' | 'percentage' | 'daily_save';
  created_at: string;
}

export interface RegretPurchase {
  id: string;
  user_id: string;
  expense_id: string;
  regret_reason: string;
  intensity: number;
  emotional_trigger?: string;
  alternative_action?: string;
  lesson_learned?: string;
  created_at: string;
  expense?: Expense;
}

export interface Insight {
  id: string;
  user_id: string;
  insight_type: 'spending_pattern' | 'budget_alert' | 'savings_tip' | 'regret_analysis';
  title: string;
  content: string;
  data: any;
  is_read: boolean;
  created_at: string;
}