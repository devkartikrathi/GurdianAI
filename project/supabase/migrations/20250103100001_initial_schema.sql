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

-- Broker connections for Zerodha integration
CREATE TABLE broker_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    broker_name VARCHAR(50) NOT NULL DEFAULT 'zerodha',
    api_key VARCHAR(255) NOT NULL,
    api_secret TEXT, -- encrypted
    access_token TEXT, -- encrypted
    request_token VARCHAR(255),
    user_id_zerodha VARCHAR(50),
    user_name VARCHAR(255),
    email VARCHAR(255),
    session_generated_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    connection_status VARCHAR(20) DEFAULT 'active' CHECK (connection_status IN ('active', 'expired', 'disconnected', 'error')),
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, broker_name)
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

-- Raw trades from CSV uploads and Zerodha API
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

-- Matched round-trip trades for Guardian AI analysis
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
    duration INTERVAL NOT NULL,
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

-- Today's trading session data
CREATE TABLE today_trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    symbol VARCHAR(50) NOT NULL,
    trade_type VARCHAR(10) NOT NULL CHECK (trade_type IN ('BUY', 'SELL')),
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    trade_datetime TIMESTAMPTZ NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'zerodha_api' CHECK (source IN ('zerodha_api', 'manual')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardian AI behavioral insights storage
CREATE TABLE guardian_ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL CHECK (insight_type IN ('overtrading', 'emotional_zones', 'win_loss_pattern', 'time_performance', 'symbol_bias')),
    insight_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    trades_analyzed INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time trading session risk tracking
CREATE TABLE risk_sessions (
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

-- User Trading Summary with complete YAML schema
CREATE TABLE user_trading_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    data_range_start DATE NOT NULL,
    data_range_end DATE NOT NULL,
    summary_data JSONB NOT NULL, -- Complete YAML schema structure
    insights_hash VARCHAR(64),
    next_update_due TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance indexes for Guardian AI queries
CREATE INDEX idx_matched_trades_user_date ON matched_trades(user_id, trade_session_date);
CREATE INDEX idx_matched_trades_symbol ON matched_trades(user_id, symbol);
CREATE INDEX idx_raw_trades_datetime ON raw_trades(user_id, trade_datetime);
CREATE INDEX idx_today_trades_user_time ON today_trades(user_id, trade_datetime);
CREATE INDEX idx_risk_sessions_user_date ON risk_sessions(user_id, session_date);
CREATE INDEX idx_guardian_insights_user_type ON guardian_ai_insights(user_id, insight_type);
CREATE INDEX idx_trading_summary_user_version ON user_trading_summary(user_id, version);

-- JSONB indexes for fast Guardian AI insights queries
CREATE INDEX idx_summary_performance ON user_trading_summary USING GIN ((summary_data->'performance'));
CREATE INDEX idx_summary_behavioral ON user_trading_summary USING GIN ((summary_data->'behavioral_metrics'));
CREATE INDEX idx_summary_emotional_flags ON user_trading_summary USING GIN ((summary_data->'emotional_flags'));

-- Row Level Security (RLS) for multi-tenant data isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE matched_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE open_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE today_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trading_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY; 