
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table for user preferences and settings
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  currency text DEFAULT 'INR',
  language text DEFAULT 'en',
  timezone text DEFAULT 'Asia/Kolkata',
  theme text DEFAULT 'dark',
  monthly_income decimal(12,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Categories table for organizing expenses
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text DEFAULT '🏷️',
  color text DEFAULT '#8B5CF6',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Expenses table for all transactions
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  amount decimal(12,2) NOT NULL,
  description text NOT NULL,
  date timestamptz DEFAULT now(),
  payment_method text DEFAULT 'cash',
  receipt_url text,
  location text,
  tags text[] DEFAULT ARRAY[]::text[],
  is_regret boolean DEFAULT false,
  regret_reason text,
  regret_intensity integer CHECK (regret_intensity >= 1 AND regret_intensity <= 5),
  created_at timestamptz DEFAULT now()
);

-- Budgets table for category-wise budget tracking
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE NOT NULL,
  amount decimal(12,2) NOT NULL,
  period text CHECK (period IN ('weekly', 'monthly', 'yearly')) DEFAULT 'monthly',
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Recurring payments table for subscriptions and bills
CREATE TABLE IF NOT EXISTS recurring_payments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  amount decimal(12,2) NOT NULL,
  frequency text CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')) DEFAULT 'monthly',
  next_due_date timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  auto_pay boolean DEFAULT false,
  provider text,
  last_paid timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Debts table for loans and credit tracking
CREATE TABLE IF NOT EXISTS debts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  total_amount decimal(12,2) NOT NULL,
  remaining_amount decimal(12,2) NOT NULL,
  interest_rate decimal(5,2) DEFAULT 0,
  emi_amount decimal(12,2) DEFAULT 0,
  due_date timestamptz,
  lender text,
  debt_type text CHECK (debt_type IN ('loan', 'credit_card', 'mortgage', 'other')) DEFAULT 'loan',
  created_at timestamptz DEFAULT now()
);

-- Savings challenges table for gamification
CREATE TABLE IF NOT EXISTS savings_challenges (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  target_amount decimal(12,2) NOT NULL,
  current_amount decimal(12,2) DEFAULT 0,
  start_date timestamptz DEFAULT now(),
  end_date timestamptz NOT NULL,
  is_completed boolean DEFAULT false,
  challenge_type text CHECK (challenge_type IN ('fixed_amount', 'percentage', 'daily_save')) DEFAULT 'fixed_amount',
  created_at timestamptz DEFAULT now()
);

-- Regret purchases table for emotional spending tracking
CREATE TABLE IF NOT EXISTS regret_purchases (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  regret_reason text NOT NULL,
  intensity integer CHECK (intensity >= 1 AND intensity <= 5) NOT NULL,
  emotional_trigger text,
  alternative_action text,
  lesson_learned text,
  created_at timestamptz DEFAULT now()
);

-- Insights table for storing generated patterns and insights
CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  insight_type text CHECK (insight_type IN ('spending_pattern', 'budget_alert', 'savings_tip', 'regret_analysis')) NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  data jsonb DEFAULT '{}',
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE regret_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own profile"
  ON profiles FOR ALL
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can manage their own categories"
  ON categories FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own recurring payments"
  ON recurring_payments FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own debts"
  ON debts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own savings challenges"
  ON savings_challenges FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own regret purchases"
  ON regret_purchases FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own insights"
  ON insights FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default categories
INSERT INTO categories (user_id, name, icon, color, is_default)
SELECT 
  id,
  unnest(ARRAY['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Bills & Utilities', 'Healthcare', 'Education', 'Travel']),
  unnest(ARRAY['🍽️', '🚗', '🛍️', '🎬', '💡', '🏥', '📚', '✈️']),
  unnest(ARRAY['#F59E0B', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#06B6D4', '#3B82F6', '#84CC16']),
  true
FROM auth.users;