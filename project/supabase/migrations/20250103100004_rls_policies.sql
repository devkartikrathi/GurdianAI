-- Row Level Security Policies for Guardian AI

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = clerk_user_id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = clerk_user_id);

-- Raw trades policies
CREATE POLICY "Users can view own raw trades" ON raw_trades
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own raw trades" ON raw_trades
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own raw trades" ON raw_trades
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own raw trades" ON raw_trades
    FOR DELETE USING (auth.uid()::text = user_id);

-- Matched trades policies
CREATE POLICY "Users can view own matched trades" ON matched_trades
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own matched trades" ON matched_trades
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own matched trades" ON matched_trades
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own matched trades" ON matched_trades
    FOR DELETE USING (auth.uid()::text = user_id);

-- Open trades policies
CREATE POLICY "Users can view own open trades" ON open_trades
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own open trades" ON open_trades
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own open trades" ON open_trades
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own open trades" ON open_trades
    FOR DELETE USING (auth.uid()::text = user_id);

-- Today trades policies
CREATE POLICY "Users can view own today trades" ON today_trades
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own today trades" ON today_trades
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own today trades" ON today_trades
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own today trades" ON today_trades
    FOR DELETE USING (auth.uid()::text = user_id);

-- Guardian AI insights policies
CREATE POLICY "Users can view own insights" ON guardian_ai_insights
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own insights" ON guardian_ai_insights
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own insights" ON guardian_ai_insights
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own insights" ON guardian_ai_insights
    FOR DELETE USING (auth.uid()::text = user_id);

-- Risk sessions policies
CREATE POLICY "Users can view own risk sessions" ON risk_sessions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own risk sessions" ON risk_sessions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own risk sessions" ON risk_sessions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own risk sessions" ON risk_sessions
    FOR DELETE USING (auth.uid()::text = user_id);

-- User trading summary policies
CREATE POLICY "Users can view own trading summary" ON user_trading_summary
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own trading summary" ON user_trading_summary
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own trading summary" ON user_trading_summary
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own trading summary" ON user_trading_summary
    FOR DELETE USING (auth.uid()::text = user_id);

-- Broker connections policies
CREATE POLICY "Users can view own broker connections" ON broker_connections
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own broker connections" ON broker_connections
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own broker connections" ON broker_connections
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own broker connections" ON broker_connections
    FOR DELETE USING (auth.uid()::text = user_id);

-- Trade books policies
CREATE POLICY "Users can view own trade books" ON trade_books
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own trade books" ON trade_books
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own trade books" ON trade_books
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own trade books" ON trade_books
    FOR DELETE USING (auth.uid()::text = user_id); 