-- Add missing columns to open_trades table to match Prisma schema
-- This migration adds the columns that are missing from the current database

-- First, let's check if the open_trades table exists, if not create it
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, symbol, trade_type)
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add isInvestment column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'open_trades' AND column_name = 'is_investment') THEN
        ALTER TABLE open_trades ADD COLUMN is_investment BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add isManuallyClosed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'open_trades' AND column_name = 'is_manually_closed') THEN
        ALTER TABLE open_trades ADD COLUMN is_manually_closed BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add manualCloseDate column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'open_trades' AND column_name = 'manual_close_date') THEN
        ALTER TABLE open_trades ADD COLUMN manual_close_date TIMESTAMPTZ;
    END IF;
    
    -- Add manualCloseReason column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'open_trades' AND column_name = 'manual_close_reason') THEN
        ALTER TABLE open_trades ADD COLUMN manual_close_reason TEXT;
    END IF;
    
    -- Add notes column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'open_trades' AND column_name = 'notes') THEN
        ALTER TABLE open_trades ADD COLUMN notes TEXT;
    END IF;
END $$;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_open_trades_is_investment ON open_trades(is_investment);
CREATE INDEX IF NOT EXISTS idx_open_trades_is_manually_closed ON open_trades(is_manually_closed);

-- Enable Row Level Security for open_trades if not already enabled
ALTER TABLE open_trades ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for open_trades
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'open_trades' AND policyname = 'Service role can access open trades') THEN
        CREATE POLICY "Service role can access open trades" ON open_trades FOR ALL USING (true);
    END IF;
END $$;
