/*
  # Guardian AI Trading Platform - Initial Schema

  1. New Tables
    - `users`
      - Core user profile with trading preferences and risk settings
      - `id` (uuid, primary key)
      - `clerk_user_id` (text, unique) - Clerk authentication ID
      - `email` (text, unique) - User email
      - `name` (text) - Display name
      - `total_capital` (decimal) - Trading capital for position sizing
      - `max_daily_drawdown_pct` (decimal) - Risk tolerance (default 2%)
      - `max_consecutive_losses` (integer) - Stop threshold (default 3)
      - `risk_per_trade_pct` (decimal) - Position sizing base (default 1%)
      - Timestamps for creation and updates

    - `trade_books`
      - Track CSV upload sessions and processing status
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `file_name` (text) - Original CSV filename
      - `file_size` (integer) - File size in bytes
      - `upload_timestamp` (timestamptz) - When uploaded
      - `parsed` (boolean) - Processing completion status
      - `total_rows` (integer) - Number of trades in file
      - `schema_mapping` (jsonb) - Column mapping configuration

    - `raw_trades`
      - Store unprocessed trade data from CSV uploads or API
      - `id` (uuid, primary key)
      - `trade_book_id` (uuid, foreign key to trade_books, nullable)
      - `user_id` (uuid, foreign key to users)
      - `symbol` (text) - Stock/instrument symbol (normalized to uppercase)
      - `trade_type` (enum) - 'BUY' or 'SELL' (normalized)
      - `quantity` (integer) - Number of shares/units
      - `price` (decimal) - Execution price
      - `amount` (decimal) - Total transaction value
      - `trade_datetime` (timestamptz) - Execution time in IST
      - `source` (enum) - 'csv' or 'zerodha_api'

    - `matched_trades`
      - Store completed round-trip trades with P&L calculations
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `symbol` (text) - Stock symbol
      - `quantity` (integer) - Position size
      - `buy_price` (decimal) - Entry price
      - `sell_price` (decimal) - Exit price
      - `pnl` (decimal) - Profit/loss amount
      - `pnl_pct` (decimal) - Return percentage
      - `buy_datetime` (timestamptz) - Entry time
      - `sell_datetime` (timestamptz) - Exit time
      - `duration` (text) - Holding period
      - `trade_session_date` (date) - Trading day for analysis

    - `open_trades`
      - Track unmatched positions awaiting closure
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `symbol` (text) - Stock symbol
      - `quantity` (integer) - Position size
      - `buy_price` (decimal) - Entry price
      - `buy_datetime` (timestamptz) - Entry time

  2. Security
    - Enable RLS on all tables
    - Add policies for users to access only their own data
    - Create indexes for performance optimization

  3. Extensions
    - Enable uuid-ossp for UUID generation
    - Enable pg_cron for scheduled tasks
*/

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Users table with trading profile
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_user_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    total_capital DECIMAL(15,2) DEFAULT 0,
    max_daily_drawdown_pct DECIMAL(5,2) DEFAULT 2.0,
    max_consecutive_losses INTEGER DEFAULT 3,
    risk_per_trade_pct DECIMAL(5,2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trade books for CSV upload tracking
CREATE TABLE trade_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    upload_timestamp TIMESTAMPTZ DEFAULT NOW(),
    parsed BOOLEAN DEFAULT FALSE,
    total_rows INTEGER DEFAULT 0,
    schema_mapping JSONB
);

-- Raw trades from CSV uploads and external APIs
CREATE TABLE raw_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trade_book_id UUID REFERENCES trade_books(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    trade_datetime TIMESTAMPTZ NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'csv' CHECK (source IN ('csv', 'zerodha_api')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matched round-trip trades for analysis
CREATE TABLE matched_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    buy_price DECIMAL(10,2) NOT NULL,
    sell_price DECIMAL(10,2) NOT NULL,
    pnl DECIMAL(15,2) NOT NULL,
    pnl_pct DECIMAL(8,4) NOT NULL,
    buy_datetime TIMESTAMPTZ NOT NULL,
    sell_datetime TIMESTAMPTZ NOT NULL,
    duration TEXT NOT NULL,
    trade_session_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Open positions awaiting closure
CREATE TABLE open_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    quantity INTEGER NOT NULL,
    buy_price DECIMAL(10,2) NOT NULL,
    buy_datetime TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for fast queries
CREATE INDEX idx_matched_trades_user_date ON matched_trades(user_id, trade_session_date);
CREATE INDEX idx_matched_trades_symbol ON matched_trades(user_id, symbol);
CREATE INDEX idx_raw_trades_datetime ON raw_trades(user_id, trade_datetime);
CREATE INDEX idx_trade_books_user ON trade_books(user_id);
CREATE INDEX idx_open_trades_user ON open_trades(user_id);

-- Row Level Security (RLS) for multi-tenant data isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE matched_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can read own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- RLS Policies for trade_books table
CREATE POLICY "Users can read own trade books"
  ON trade_books
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users 
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can insert own trade books"
  ON trade_books
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM users 
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- RLS Policies for raw_trades table
CREATE POLICY "Users can read own raw trades"
  ON raw_trades
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users 
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can insert own raw trades"
  ON raw_trades
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM users 
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- RLS Policies for matched_trades table
CREATE POLICY "Users can read own matched trades"
  ON matched_trades
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users 
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can insert own matched trades"
  ON matched_trades
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM users 
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- RLS Policies for open_trades table
CREATE POLICY "Users can read own open trades"
  ON open_trades
  FOR SELECT
  TO authenticated
  USING (user_id IN (
    SELECT id FROM users 
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "Users can insert own open trades"
  ON open_trades
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id IN (
    SELECT id FROM users 
    WHERE clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- Function to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();