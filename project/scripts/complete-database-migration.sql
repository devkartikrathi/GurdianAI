-- Complete database migration to sync with Prisma schema
-- This script adds all missing tables and columns

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Users table with trading profile (already exists, but ensure it has all columns)
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

-- TradeBook table
CREATE TABLE IF NOT EXISTS trade_books (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    upload_timestamp TIMESTAMPTZ DEFAULT NOW(),
    parsed BOOLEAN DEFAULT FALSE,
    total_rows INTEGER DEFAULT 0,
    schema_mapping JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Raw trades table (update existing or create new)
CREATE TABLE IF NOT EXISTS raw_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    trade_book_id UUID REFERENCES trade_books(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
    quantity DECIMAL(15,2) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    trade_datetime TIMESTAMPTZ NOT NULL,
    commission DECIMAL(15,2) DEFAULT 0,
    trade_id VARCHAR(255),
    remaining_quantity DECIMAL(15,2) DEFAULT 0,
    matched_quantity DECIMAL(15,2) DEFAULT 0,
    is_fully_matched BOOLEAN DEFAULT FALSE,
    is_open_position BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matched trades table (update existing or create new)
CREATE TABLE IF NOT EXISTS matched_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    buy_date TIMESTAMPTZ NOT NULL,
    sell_date TIMESTAMPTZ NOT NULL,
    buy_time VARCHAR(20),
    sell_time VARCHAR(20),
    quantity DECIMAL(15,2) NOT NULL,
    buy_price DECIMAL(15,2) NOT NULL,
    sell_price DECIMAL(15,2) NOT NULL,
    pnl DECIMAL(15,2) NOT NULL,
    pnl_pct DECIMAL(8,4) NOT NULL,
    commission DECIMAL(15,2) DEFAULT 0,
    buy_trade_id VARCHAR(255),
    sell_trade_id VARCHAR(255),
    duration INTEGER,
    is_realized BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Open trades table (create new)
CREATE TABLE IF NOT EXISTS open_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
    date TIMESTAMPTZ NOT NULL,
    time VARCHAR(20),
    price DECIMAL(15,2) NOT NULL,
    quantity DECIMAL(15,2) NOT NULL,
    commission DECIMAL(15,2) DEFAULT 0,
    trade_id VARCHAR(255),
    remaining_quantity DECIMAL(15,2) NOT NULL,
    average_price DECIMAL(15,2) NOT NULL,
    unrealized_pnl DECIMAL(15,2) DEFAULT 0,
    unrealized_pnl_pct DECIMAL(8,4) DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_investment BOOLEAN DEFAULT FALSE,
    is_manually_closed BOOLEAN DEFAULT FALSE,
    manual_close_date TIMESTAMPTZ,
    manual_close_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, symbol, trade_type)
);

-- Broker connections table
CREATE TABLE IF NOT EXISTS broker_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_name VARCHAR(50) DEFAULT 'zerodha',
    api_key VARCHAR(255) NOT NULL,
    api_secret VARCHAR(255),
    access_token TEXT,
    request_token VARCHAR(255),
    user_id_zerodha VARCHAR(255),
    user_name VARCHAR(255),
    email VARCHAR(255),
    session_generated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    connection_status VARCHAR(20) DEFAULT 'active',
    last_sync_at TIMESTAMPTZ,
    oauth_action VARCHAR(50),
    oauth_status VARCHAR(50),
    oauth_type VARCHAR(50),
    oauth_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, broker_name)
);

-- Daily trades table
CREATE TABLE IF NOT EXISTS daily_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_connection_id UUID NOT NULL REFERENCES broker_connections(id) ON DELETE CASCADE,
    trade_date TIMESTAMPTZ NOT NULL,
    total_trades INTEGER DEFAULT 0,
    total_buy_trades INTEGER DEFAULT 0,
    total_sell_trades INTEGER DEFAULT 0,
    total_buy_quantity DECIMAL(15,2) DEFAULT 0,
    total_sell_quantity DECIMAL(15,2) DEFAULT 0,
    total_buy_value DECIMAL(15,2) DEFAULT 0,
    total_sell_value DECIMAL(15,2) DEFAULT 0,
    net_quantity DECIMAL(15,2) DEFAULT 0,
    net_value DECIMAL(15,2) DEFAULT 0,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, broker_connection_id, trade_date)
);

-- Risk sessions table (already exists, but ensure it has all columns)
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

-- Additional tables from Prisma schema
CREATE TABLE IF NOT EXISTS guardian_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(100) NOT NULL,
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    trades_analyzed INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_trading_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    data_range_start DATE NOT NULL,
    data_range_end DATE NOT NULL,
    summary_data JSONB NOT NULL,
    insights_hash VARCHAR(255),
    next_update_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    experience VARCHAR(100),
    total_capital DECIMAL(15,2) NOT NULL,
    risk_per_trade_pct DECIMAL(5,2) NOT NULL,
    max_daily_drawdown_pct DECIMAL(5,2) NOT NULL,
    max_consecutive_losses INTEGER NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_alerts BOOLEAN DEFAULT TRUE,
    daily_digest BOOLEAN DEFAULT TRUE,
    weekly_report BOOLEAN DEFAULT FALSE,
    trade_notifications BOOLEAN DEFAULT TRUE,
    performance_alerts BOOLEAN DEFAULT TRUE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_exports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    file_path VARCHAR(500),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_trade_books_user_id ON trade_books(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_trades_user_id ON raw_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_trades_symbol ON raw_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_raw_trades_trade_datetime ON raw_trades(trade_datetime);
CREATE INDEX IF NOT EXISTS idx_raw_trades_trade_type ON raw_trades(trade_type);
CREATE INDEX IF NOT EXISTS idx_raw_trades_trade_book_id ON raw_trades(trade_book_id);
CREATE INDEX IF NOT EXISTS idx_raw_trades_remaining_quantity ON raw_trades(remaining_quantity);
CREATE INDEX IF NOT EXISTS idx_raw_trades_matched_quantity ON raw_trades(matched_quantity);
CREATE INDEX IF NOT EXISTS idx_raw_trades_is_fully_matched ON raw_trades(is_fully_matched);
CREATE INDEX IF NOT EXISTS idx_raw_trades_is_open_position ON raw_trades(is_open_position);
CREATE INDEX IF NOT EXISTS idx_matched_trades_user_id ON matched_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_matched_trades_symbol ON matched_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_matched_trades_buy_date ON matched_trades(buy_date);
CREATE INDEX IF NOT EXISTS idx_matched_trades_sell_date ON matched_trades(sell_date);
CREATE INDEX IF NOT EXISTS idx_matched_trades_is_realized ON matched_trades(is_realized);
CREATE INDEX IF NOT EXISTS idx_open_trades_user_id ON open_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_open_trades_symbol ON open_trades(symbol);
CREATE INDEX IF NOT EXISTS idx_open_trades_trade_type ON open_trades(trade_type);
CREATE INDEX IF NOT EXISTS idx_open_trades_date ON open_trades(date);
CREATE INDEX IF NOT EXISTS idx_open_trades_is_investment ON open_trades(is_investment);
CREATE INDEX IF NOT EXISTS idx_open_trades_is_manually_closed ON open_trades(is_manually_closed);
CREATE INDEX IF NOT EXISTS idx_daily_trades_user_date ON daily_trades(user_id, trade_date);
CREATE INDEX IF NOT EXISTS idx_risk_sessions_user_date ON risk_sessions(user_id, session_date);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE matched_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service role authentication
CREATE POLICY "Service role can access users" ON users FOR ALL USING (true);
CREATE POLICY "Service role can access trade books" ON trade_books FOR ALL USING (true);
CREATE POLICY "Service role can access raw trades" ON raw_trades FOR ALL USING (true);
CREATE POLICY "Service role can access matched trades" ON matched_trades FOR ALL USING (true);
CREATE POLICY "Service role can access open trades" ON open_trades FOR ALL USING (true);
CREATE POLICY "Service role can access broker connections" ON broker_connections FOR ALL USING (true);
CREATE POLICY "Service role can access daily trades" ON daily_trades FOR ALL USING (true);
CREATE POLICY "Service role can access risk sessions" ON risk_sessions FOR ALL USING (true);
CREATE POLICY "Service role can access guardian insights" ON guardian_ai_insights FOR ALL USING (true);
CREATE POLICY "Service role can access trading summaries" ON user_trading_summary FOR ALL USING (true);
CREATE POLICY "Service role can access onboarding" ON onboarding FOR ALL USING (true);
CREATE POLICY "Service role can access notification preferences" ON notification_preferences FOR ALL USING (true);
CREATE POLICY "Service role can access data exports" ON data_exports FOR ALL USING (true);
