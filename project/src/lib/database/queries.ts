import { supabase, supabaseAdmin } from '../supabase';
import { User, TradeBook, RawTrade, MatchedTrade, RiskSession } from '@/types/database';

export class DatabaseQueries {
  // User Management
  static async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getUserByClerkId(clerkUserId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async updateUserProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Trade Book Management
  static async createTradeBook(tradeBookData: Omit<TradeBook, 'id' | 'upload_timestamp'>) {
    const { data, error } = await supabase
      .from('trade_books')
      .insert([tradeBookData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTradeBooks(userId: string) {
    const { data, error } = await supabase
      .from('trade_books')
      .select('*')
      .eq('user_id', userId)
      .order('upload_timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  // Raw Trades Management
  static async insertRawTrades(trades: Omit<RawTrade, 'id' | 'created_at'>[]) {
    const { data, error } = await supabase
      .from('raw_trades')
      .insert(trades)
      .select();
    
    if (error) throw error;
    return data;
  }

  static async getRawTradesByBook(tradeBookId: string) {
    const { data, error } = await supabase
      .from('raw_trades')
      .select('*')
      .eq('trade_book_id', tradeBookId)
      .order('trade_datetime', { ascending: true });
    
    if (error) throw error;
    return data;
  }

  // Matched Trades Management
  static async insertMatchedTrades(trades: Omit<MatchedTrade, 'id' | 'created_at'>[]) {
    const { data, error } = await supabase
      .from('matched_trades')
      .insert(trades)
      .select();
    
    if (error) throw error;
    return data;
  }

  static async getMatchedTrades(userId: string, limit?: number) {
    let query = supabase
      .from('matched_trades')
      .select('*')
      .eq('user_id', userId)
      .order('sell_datetime', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  // Risk Session Management
  static async getRiskSession(userId: string, sessionDate: string) {
    const { data, error } = await supabase
      .from('risk_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('session_date', sessionDate)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async upsertRiskSession(riskSession: Omit<RiskSession, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('risk_sessions')
      .upsert([riskSession], { onConflict: 'user_id,session_date' })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Performance Analytics
  static async getPerformanceMetrics(userId: string, dateRange?: { start: string; end: string }) {
    let query = supabase
      .from('matched_trades')
      .select('*')
      .eq('user_id', userId);
    
    if (dateRange) {
      query = query
        .gte('trade_session_date', dateRange.start)
        .lte('trade_session_date', dateRange.end);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }
}