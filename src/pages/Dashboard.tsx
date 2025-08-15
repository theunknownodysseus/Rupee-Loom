import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, TrendingDown, Target, AlertCircle, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';

const Dashboard: React.FC = () => {
  const { expenses, budgets, recurringPayments, debts, savingsChallenges, insights } = useData();
  const { profile } = useAuth();

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const monthlyStats = useMemo(() => {
    const monthlyExpenses = expenses.filter(expense => 
      isWithinInterval(new Date(expense.date), { start: monthStart, end: monthEnd })
    );

    const totalSpent = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const regretSpending = monthlyExpenses.filter(expense => expense.is_regret).reduce((sum, expense) => sum + expense.amount, 0);
    const upcomingPayments = recurringPayments.filter(payment => 
      new Date(payment.next_due_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    return {
      totalSpent,
      totalBudget,
      budgetRemaining: totalBudget - totalSpent,
      regretSpending,
      upcomingPayments,
      expenseCount: monthlyExpenses.length,
    };
  }, [expenses, budgets, recurringPayments, monthStart, monthEnd]);

  const recentExpenses = useMemo(() => {
    return expenses.slice(0, 5);
  }, [expenses]);

  const activeChallenges = useMemo(() => {
    return savingsChallenges.filter(challenge => !challenge.is_completed).slice(0, 3);
  }, [savingsChallenges]);

  const unreadInsights = useMemo(() => {
    return insights.filter(insight => !insight.is_read).slice(0, 3);
  }, [insights]);

  const StatCard = ({ title, value, change, icon: Icon, gradient, href }: {
    title: string;
    value: string;
    change?: string;
    icon: any;
    gradient: string;
    href?: string;
  }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      className={`p-6 rounded-2xl bg-gradient-to-br ${gradient} shadow-xl border border-white/10 backdrop-blur-sm`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="h-8 w-8 text-white/80" />
        {href && (
          <Link to={href} className="text-white/60 hover:text-white/80 transition-colors">
            <Plus className="h-5 w-5" />
          </Link>
        )}
      </div>
      <h3 className="text-white/70 text-sm font-medium mb-1">{title}</h3>
      <p className="text-white text-2xl font-bold mb-1">{value}</p>
      {change && (
        <p className="text-white/60 text-sm">{change}</p>
      )}
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-white mb-2"
          >
            Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
          </motion.h1>
          <p className="text-gray-400">
            {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Link
            to="/expense"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-200"
          >
            <Plus className="w-5 h-5 mr-2" />
            Quick Expense
          </Link>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Monthly Spent"
          value={`₹${monthlyStats.totalSpent.toLocaleString()}`}
          change={`${monthlyStats.expenseCount} transactions`}
          icon={TrendingUp}
          gradient="from-blue-600 to-blue-800"
        />
        <StatCard
          title="Budget Remaining"
          value={`₹${Math.max(0, monthlyStats.budgetRemaining).toLocaleString()}`}
          change={monthlyStats.budgetRemaining < 0 ? 'Over budget!' : 'On track'}
          icon={Target}
          gradient="from-green-600 to-green-800"
          href="/budgets"
        />
        <StatCard
          title="Regret Spending"
          value={`₹${monthlyStats.regretSpending.toLocaleString()}`}
          change="This month"
          icon={TrendingDown}
          gradient="from-red-600 to-red-800"
          href="/regrets"
        />
        <StatCard
          title="Upcoming Payments"
          value={monthlyStats.upcomingPayments.length.toString()}
          change="Next 7 days"
          icon={Calendar}
          gradient="from-purple-600 to-purple-800"
          href="/recurring"
        />
      </motion.div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Expenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Expenses</h2>
            <Link to="/insights" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentExpenses.length > 0 ? (
              recentExpenses.map((expense, index) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                      <span className="text-white text-lg">
                        {expense.category?.icon || '💰'}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{expense.description}</p>
                      <p className="text-gray-400 text-sm">
                        {expense.category?.name} • {format(new Date(expense.date), 'MMM dd')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">₹{expense.amount.toLocaleString()}</p>
                    {expense.is_regret && (
                      <p className="text-red-400 text-xs">Regret</p>
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400">No expenses recorded yet</p>
                <Link to="/expense" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">
                  Add your first expense
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Sidebar */}
        <div className="space-y-8">
          {/* Savings Challenges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Active Challenges</h3>
              <Link to="/savings" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {activeChallenges.length > 0 ? (
                activeChallenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30"
                  >
                    <h4 className="text-white font-medium mb-2">{challenge.title}</h4>
                    <div className="w-full bg-gray-600/50 rounded-full h-2 mb-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (challenge.current_amount / challenge.target_amount) * 100)}%`
                        }}
                      />
                    </div>
                    <p className="text-gray-400 text-sm">
                      ₹{challenge.current_amount.toLocaleString()} / ₹{challenge.target_amount.toLocaleString()}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No active challenges</p>
                  <Link to="/savings" className="text-purple-400 hover:text-purple-300 text-xs mt-1 inline-block">
                    Start a challenge
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Recent Insights</h3>
              <Link to="/insights" className="text-purple-400 hover:text-purple-300 text-sm font-medium">
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {unreadInsights.length > 0 ? (
                unreadInsights.map((insight, index) => (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30"
                  >
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h4 className="text-white font-medium mb-1">{insight.title}</h4>
                        <p className="text-gray-400 text-sm line-clamp-2">{insight.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-400 text-sm">No new insights</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;