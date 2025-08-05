-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Users table with trading profile
CREATE TABLE IF NOT EXISTS users (
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

-- Raw trades from CSV uploads
CREATE TABLE IF NOT EXISTS raw_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Matched round-trip trades for Guardian AI analysis
CREATE TABLE IF NOT EXISTS matched_trades (
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
    duration INTERVAL NOT NULL,
    trade_session_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk sessions for real-time monitoring
CREATE TABLE IF NOT EXISTS risk_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    trades_count INTEGER DEFAULT 0,
    current_pnl DECIMAL(15,2) DEFAULT 0,
    current_drawdown_pct DECIMAL(5,2) DEFAULT 0,
    consecutive_losses INTEGER DEFAULT 0,
    last_trade_time TIMESTAMPTZ,
    risk_status VARCHAR(10) DEFAULT 'green' CHECK (risk_status IN ('green', 'amber', 'red')),
    session_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, session_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_raw_trades_user_datetime ON raw_trades(user_id, trade_datetime);
CREATE INDEX IF NOT EXISTS idx_matched_trades_user_date ON matched_trades(user_id, trade_session_date);
CREATE INDEX IF NOT EXISTS idx_risk_sessions_user_date ON risk_sessions(user_id, session_date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE matched_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service role authentication
-- Note: These policies allow the service role to access data, but the application
-- will filter by clerk_user_id to ensure data isolation

CREATE POLICY "Service role can access users" ON users FOR ALL USING (true);
CREATE POLICY "Service role can access raw trades" ON raw_trades FOR ALL USING (true);
CREATE POLICY "Service role can access matched trades" ON matched_trades FOR ALL USING (true);
CREATE POLICY "Service role can access risk sessions" ON risk_sessions FOR ALL USING (true);

-- Alternative: More restrictive policies (uncomment if you want stricter access)
-- CREATE POLICY "Users can view own data" ON users FOR SELECT USING (true);
-- CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (true);
-- CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Users can view own raw trades" ON raw_trades FOR SELECT USING (true);
-- CREATE POLICY "Users can insert own raw trades" ON raw_trades FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Users can view own matched trades" ON matched_trades FOR SELECT USING (true);
-- CREATE POLICY "Users can insert own matched trades" ON matched_trades FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Users can view own risk sessions" ON risk_sessions FOR SELECT USING (true);
-- CREATE POLICY "Users can insert own risk sessions" ON risk_sessions FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Users can update own risk sessions" ON risk_sessions FOR UPDATE USING (true);

-- Insert test user (optional)
-- INSERT INTO users (clerk_user_id, email, name, total_capital) 
-- VALUES ('user_test123', 'test@example.com', 'Test User', 100000)
-- ON CONFLICT (clerk_user_id) DO NOTHING; 