-- Create missing tables that exist in Prisma schema but not in the original setup

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

-- Update raw_trades table to match Prisma schema
DO $$ 
BEGIN
    -- Add missing columns to raw_trades
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'raw_trades' AND column_name = 'trade_book_id') THEN
        ALTER TABLE raw_trades ADD COLUMN trade_book_id UUID REFERENCES trade_books(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'raw_trades' AND column_name = 'remaining_quantity') THEN
        ALTER TABLE raw_trades ADD COLUMN remaining_quantity DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'raw_trades' AND column_name = 'matched_quantity') THEN
        ALTER TABLE raw_trades ADD COLUMN matched_quantity DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'raw_trades' AND column_name = 'is_fully_matched') THEN
        ALTER TABLE raw_trades ADD COLUMN is_fully_matched BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'raw_trades' AND column_name = 'is_open_position') THEN
        ALTER TABLE raw_trades ADD COLUMN is_open_position BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'raw_trades' AND column_name = 'updated_at') THEN
        ALTER TABLE raw_trades ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Update matched_trades table to match Prisma schema
DO $$ 
BEGIN
    -- Add missing columns to matched_trades
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matched_trades' AND column_name = 'buy_date') THEN
        ALTER TABLE matched_trades ADD COLUMN buy_date TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matched_trades' AND column_name = 'sell_date') THEN
        ALTER TABLE matched_trades ADD COLUMN sell_date TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matched_trades' AND column_name = 'buy_time') THEN
        ALTER TABLE matched_trades ADD COLUMN buy_time VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matched_trades' AND column_name = 'sell_time') THEN
        ALTER TABLE matched_trades ADD COLUMN sell_time VARCHAR(20);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matched_trades' AND column_name = 'buy_trade_id') THEN
        ALTER TABLE matched_trades ADD COLUMN buy_trade_id VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matched_trades' AND column_name = 'sell_trade_id') THEN
        ALTER TABLE matched_trades ADD COLUMN sell_trade_id TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matched_trades' AND column_name = 'duration') THEN
        ALTER TABLE matched_trades ADD COLUMN duration INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matched_trades' AND column_name = 'is_realized') THEN
        ALTER TABLE matched_trades ADD COLUMN is_realized BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'matched_trades' AND column_name = 'updated_at') THEN
        ALTER TABLE matched_trades ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Create additional missing tables
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_trade_books_user_id ON trade_books(user_id);
CREATE INDEX IF NOT EXISTS idx_raw_trades_trade_book_id ON raw_trades(trade_book_id);
CREATE INDEX IF NOT EXISTS idx_raw_trades_remaining_quantity ON raw_trades(remaining_quantity);
CREATE INDEX IF NOT EXISTS idx_raw_trades_matched_quantity ON raw_trades(matched_quantity);
CREATE INDEX IF NOT EXISTS idx_raw_trades_is_fully_matched ON raw_trades(is_fully_matched);
CREATE INDEX IF NOT EXISTS idx_raw_trades_is_open_position ON raw_trades(is_open_position);
CREATE INDEX IF NOT EXISTS idx_matched_trades_buy_date ON matched_trades(buy_date);
CREATE INDEX IF NOT EXISTS idx_matched_trades_sell_date ON matched_trades(sell_date);
CREATE INDEX IF NOT EXISTS idx_matched_trades_is_realized ON matched_trades(is_realized);
CREATE INDEX IF NOT EXISTS idx_daily_trades_user_date ON daily_trades(user_id, trade_date);

-- Enable RLS for new tables
ALTER TABLE trade_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Service role can access trade books" ON trade_books FOR ALL USING (true);
CREATE POLICY "Service role can access broker connections" ON broker_connections FOR ALL USING (true);
CREATE POLICY "Service role can access daily trades" ON daily_trades FOR ALL USING (true);
