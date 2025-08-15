import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Target, Edit3, Trash2, AlertCircle, TrendingUp } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Budget } from '../lib/supabase';
import { startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import toast from 'react-hot-toast';

interface BudgetFormData {
  category_id: string;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
}

const Budgets: React.FC = () => {
  const { categories, budgets, expenses, refreshData } = useData();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<BudgetFormData>();

  // Calculate budget progress
  const budgetProgress = useMemo(() => {
    const currentMonth = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    return budgets.map(budget => {
      const categoryExpenses = expenses.filter(expense => 
        expense.category_id === budget.category_id &&
        isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
      );

      const spent = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      const remaining = budget.amount - spent;
      const percentage = (spent / budget.amount) * 100;

      return {
        ...budget,
        spent,
        remaining,
        percentage: Math.min(percentage, 100),
        isOverBudget: spent > budget.amount,
      };
    });
  }, [budgets, expenses]);

  const onSubmit = async (data: BudgetFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const currentMonth = new Date();
      const startDate = startOfMonth(currentMonth).toISOString();
      const endDate = endOfMonth(currentMonth).toISOString();

      const budgetData = {
        user_id: user.id,
        category_id: data.category_id,
        amount: data.amount,
        period: data.period,
        start_date: startDate,
        end_date: endDate,
      };

      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update(budgetData)
          .eq('id', editingBudget.id);

        if (error) throw error;
        toast.success('Budget updated successfully!');
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert([budgetData]);

        if (error) throw error;
        toast.success('Budget created successfully!');
      }

      reset();
      setShowForm(false);
      setEditingBudget(null);
      await refreshData();
    } catch (error: any) {
      console.error('Error saving budget:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setValue('category_id', budget.category_id);
    setValue('amount', budget.amount);
    setValue('period', budget.period);
    setShowForm(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId);

      if (error) throw error;
      toast.success('Budget deleted successfully!');
      await refreshData();
    } catch (error: any) {
      console.error('Error deleting budget:', error);
      toast.error(error.message);
    }
  };

  const handleCancel = () => {
    reset();
    setShowForm(false);
    setEditingBudget(null);
  };

  const getProgressColor = (percentage: number, isOverBudget: boolean) => {
    if (isOverBudget) return 'from-red-500 to-red-600';
    if (percentage > 80) return 'from-yellow-500 to-orange-500';
    if (percentage > 60) return 'from-blue-500 to-purple-500';
    return 'from-green-500 to-blue-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-2">Budget Threads</h1>
          <p className="text-gray-400">Weave your financial boundaries and track progress</p>
        </motion.div>
        
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Budget
        </motion.button>
      </div>

      {/* Budget Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm"
          >
            <h3 className="text-xl font-semibold text-white mb-6">
              {editingBudget ? 'Edit Budget' : 'Create New Budget'}
            </h3>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category *
                  </label>
                  <select
                    {...register('category_id', { required: 'Category is required' })}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="mt-1 text-sm text-red-400">{errors.category_id.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Budget Amount *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than 0' } })}
                      className="w-full pl-8 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.amount && (
                    <p className="mt-1 text-sm text-red-400">{errors.amount.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Period
                  </label>
                  <select
                    {...register('period')}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? 'Saving...' : (editingBudget ? 'Update Budget' : 'Create Budget')}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Budget List */}
      <div className="space-y-6">
        {budgetProgress.length > 0 ? (
          budgetProgress.map((budget, index) => (
            <motion.div
              key={budget.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
              className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: budget.category?.color }}
                  >
                    <span className="text-white text-xl">
                      {budget.category?.icon || '💰'}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {budget.category?.name || 'Unknown Category'}
                    </h3>
                    <p className="text-gray-400 text-sm capitalize">{budget.period} budget</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(budget)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(budget.id)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className={`text-sm font-medium ${budget.isOverBudget ? 'text-red-400' : 'text-gray-300'}`}>
                      {budget.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor(budget.percentage, budget.isOverBudget)}`}
                    />
                  </div>
                </div>

                {/* Budget Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">₹{budget.amount.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">Budget</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">₹{budget.spent.toLocaleString()}</p>
                    <p className="text-gray-400 text-sm">Spent</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${budget.remaining >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ₹{Math.abs(budget.remaining).toLocaleString()}
                    </p>
                    <p className="text-gray-400 text-sm">
                      {budget.remaining >= 0 ? 'Remaining' : 'Over Budget'}
                    </p>
                  </div>
                </div>

                {/* Alert for over budget */}
                {budget.isOverBudget && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                  >
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-400 text-sm">
                      You've exceeded your budget by ₹{Math.abs(budget.remaining).toLocaleString()}
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No budgets yet</h3>
            <p className="text-gray-400 mb-6">Start creating budgets to track your spending limits</p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Budget
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Budgets;