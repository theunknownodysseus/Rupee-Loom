import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { Plus, Heart, Upload, Mic, MapPin, Tag, Calendar, CreditCard } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ExpenseFormData {
  amount: number;
  description: string;
  category_id: string;
  payment_method: string;
  date: string;
  location?: string;
  tags: string[];
  is_regret: boolean;
  regret_reason?: string;
  regret_intensity?: number;
}

const QuickExpense: React.FC = () => {
  const { categories, refreshData } = useData();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegretFields, setShowRegretFields] = useState(false);

  const { register, handleSubmit, control, watch, setValue, reset, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      amount: 0,
      description: '',
      category_id: '',
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0],
      location: '',
      tags: [],
      is_regret: false,
      regret_reason: '',
      regret_intensity: 3,
    }
  });

  const isRegret = watch('is_regret');

  useEffect(() => {
    setShowRegretFields(isRegret);
  }, [isRegret]);

  const onSubmit = async (data: ExpenseFormData) => {
    if (!user) return;

    setIsSubmitting(true);

    try {
      const expenseData = {
        user_id: user.id,
        amount: data.amount,
        description: data.description,
        category_id: data.category_id || null,
        payment_method: data.payment_method,
        date: new Date(data.date).toISOString(),
        location: data.location || null,
        tags: data.tags,
        is_regret: data.is_regret,
        regret_reason: data.is_regret ? data.regret_reason : null,
        regret_intensity: data.is_regret ? data.regret_intensity : null,
      };

      const { error } = await supabase
        .from('expenses')
        .insert([expenseData]);

      if (error) throw error;

      toast.success('Expense added successfully!');
      reset();
      await refreshData();
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: '💰' },
    { value: 'card', label: 'Card', icon: '💳' },
    { value: 'upi', label: 'UPI', icon: '📱' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Quick Weave</h1>
        <p className="text-gray-400">Add an expense to your financial tapestry</p>
      </motion.div>

      {/* Quick Amount Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-4 gap-4"
      >
        {[50, 100, 500, 1000].map((amount) => (
          <motion.button
            key={amount}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setValue('amount', amount)}
            className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 text-white font-semibold hover:bg-gray-700/50 transition-colors"
          >
            ₹{amount}
          </motion.button>
        ))}
      </motion.div>

      {/* Main Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700/50 backdrop-blur-sm"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg">₹</span>
              <input
                type="number"
                step="0.01"
                {...register('amount', { required: 'Amount is required', min: { value: 0.01, message: 'Amount must be greater than 0' } })}
                className="w-full pl-10 pr-4 py-4 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white text-xl font-semibold placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-400">{errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <input
              type="text"
              {...register('description', { required: 'Description is required' })}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              placeholder="What did you spend on?"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Category and Payment Method Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                {...register('category_id')}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Payment Method
              </label>
              <Controller
                name="payment_method"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-2">
                    {paymentMethods.map((method) => (
                      <motion.button
                        key={method.value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => field.onChange(method.value)}
                        className={`p-3 rounded-lg border transition-colors ${
                          field.value === method.value
                            ? 'bg-purple-600 border-purple-500 text-white'
                            : 'bg-gray-700/50 border-gray-600/50 text-gray-300 hover:bg-gray-700'
                        }`}
                      >
                        <span className="text-lg mb-1 block">{method.icon}</span>
                        <span className="text-xs">{method.label}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              />
            </div>
          </div>

          {/* Date and Location Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="date"
                  {...register('date')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  {...register('location')}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  placeholder="Where did you spend?"
                />
              </div>
            </div>
          </div>

          {/* Regret Tracking */}
          <div className="border border-gray-700/50 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Heart className="h-5 w-5 text-red-400" />
              <label className="text-sm font-medium text-gray-300">
                Emotional Spending Tracker
              </label>
            </div>

            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                {...register('is_regret')}
                className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
              />
              <span className="text-white">I regret this purchase</span>
            </div>

            {showRegretFields && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Why do you regret this?
                  </label>
                  <textarea
                    {...register('regret_reason')}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors resize-none"
                    rows={3}
                    placeholder="Describe what triggered this purchase..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Regret Intensity (1-5)
                  </label>
                  <Controller
                    name="regret_intensity"
                    control={control}
                    render={({ field }) => (
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((intensity) => (
                          <motion.button
                            key={intensity}
                            type="button"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => field.onChange(intensity)}
                            className={`w-10 h-10 rounded-full border-2 transition-colors ${
                              field.value === intensity
                                ? 'bg-red-500 border-red-400 text-white'
                                : 'border-gray-600 text-gray-400 hover:border-red-400'
                            }`}
                          >
                            {intensity}
                          </motion.button>
                        ))}
                      </div>
                    )}
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isSubmitting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full inline-block"
              />
            ) : (
              <>
                <Plus className="w-5 h-5 inline-block mr-2" />
                Add Expense
              </>
            )}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default QuickExpense;