import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase, Category, Expense, Budget, RecurringPayment, Debt, SavingsChallenge, RegretPurchase, Insight } from '../lib/supabase';

interface DataContextType {
  categories: Category[];
  expenses: Expense[];
  budgets: Budget[];
  recurringPayments: RecurringPayment[];
  debts: Debt[];
  savingsChallenges: SavingsChallenge[];
  regretPurchases: RegretPurchase[];
  insights: Insight[];
  loading: boolean;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [savingsChallenges, setSavingsChallenges] = useState<SavingsChallenge[]>([]);
  const [regretPurchases, setRegretPurchases] = useState<RegretPurchase[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all data in parallel
      const [
        categoriesResult,
        expensesResult,
        budgetsResult,
        recurringPaymentsResult,
        debtsResult,
        savingsChallengesResult,
        regretPurchasesResult,
        insightsResult
      ] = await Promise.all([
        supabase.from('categories').select('*').eq('user_id', user.id).order('created_at'),
        supabase.from('expenses').select(`
          *,
          category:categories(*)
        `).eq('user_id', user.id).order('date', { ascending: false }),
        supabase.from('budgets').select(`
          *,
          category:categories(*)
        `).eq('user_id', user.id).eq('is_active', true),
        supabase.from('recurring_payments').select(`
          *,
          category:categories(*)
        `).eq('user_id', user.id).eq('is_active', true),
        supabase.from('debts').select('*').eq('user_id', user.id),
        supabase.from('savings_challenges').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('regret_purchases').select(`
          *,
          expense:expenses(*)
        `).eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('insights').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      ]);

      if (categoriesResult.data) setCategories(categoriesResult.data);
      if (expensesResult.data) setExpenses(expensesResult.data);
      if (budgetsResult.data) setBudgets(budgetsResult.data);
      if (recurringPaymentsResult.data) setRecurringPayments(recurringPaymentsResult.data);
      if (debtsResult.data) setDebts(debtsResult.data);
      if (savingsChallengesResult.data) setSavingsChallenges(savingsChallengesResult.data);
      if (regretPurchasesResult.data) setRegretPurchases(regretPurchasesResult.data);
      if (insightsResult.data) setInsights(insightsResult.data);

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user]);

  const value = {
    categories,
    expenses,
    budgets,
    recurringPayments,
    debts,
    savingsChallenges,
    regretPurchases,
    insights,
    loading,
    refreshData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};