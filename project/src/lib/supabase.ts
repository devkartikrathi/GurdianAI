import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client for admin operations
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_user_id: string
          email: string
          name: string
          total_capital: number
          max_daily_drawdown_pct: number
          max_consecutive_losses: number
          risk_per_trade_pct: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_user_id: string
          email: string
          name: string
          total_capital?: number
          max_daily_drawdown_pct?: number
          max_consecutive_losses?: number
          risk_per_trade_pct?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_user_id?: string
          email?: string
          name?: string
          total_capital?: number
          max_daily_drawdown_pct?: number
          max_consecutive_losses?: number
          risk_per_trade_pct?: number
          created_at?: string
          updated_at?: string
        }
      }
      raw_trades: {
        Row: {
          id: string
          trade_book_id?: string
          user_id: string
          symbol: string
          trade_type: 'BUY' | 'SELL'
          quantity: number
          price: number
          amount: number
          trade_datetime: string
          source: 'csv' | 'zerodha_api'
          created_at: string
        }
        Insert: {
          id?: string
          trade_book_id?: string
          user_id: string
          symbol: string
          trade_type: 'BUY' | 'SELL'
          quantity: number
          price: number
          amount: number
          trade_datetime: string
          source?: 'csv' | 'zerodha_api'
          created_at?: string
        }
        Update: {
          id?: string
          trade_book_id?: string
          user_id?: string
          symbol?: string
          trade_type?: 'BUY' | 'SELL'
          quantity?: number
          price?: number
          amount?: number
          trade_datetime?: string
          source?: 'csv' | 'zerodha_api'
          created_at?: string
        }
      }
      matched_trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          quantity: number
          buy_price: number
          sell_price: number
          pnl: number
          pnl_pct: number
          buy_datetime: string
          sell_datetime: string
          duration: number
          trade_session_date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          quantity: number
          buy_price: number
          sell_price: number
          pnl: number
          pnl_pct: number
          buy_datetime: string
          sell_datetime: string
          duration: number
          trade_session_date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          quantity?: number
          buy_price?: number
          sell_price?: number
          pnl?: number
          pnl_pct?: number
          buy_datetime?: string
          sell_datetime?: string
          duration?: number
          trade_session_date?: string
          created_at?: string
        }
      }
      risk_sessions: {
        Row: {
          id: string
          user_id: string
          session_date: string
          trades_count: number
          current_pnl: number
          current_drawdown_pct: number
          consecutive_losses: number
          last_trade_time?: string
          risk_status: 'green' | 'amber' | 'red'
          session_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_date: string
          trades_count?: number
          current_pnl?: number
          current_drawdown_pct?: number
          consecutive_losses?: number
          last_trade_time?: string
          risk_status?: 'green' | 'amber' | 'red'
          session_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_date?: string
          trades_count?: number
          current_pnl?: number
          current_drawdown_pct?: number
          consecutive_losses?: number
          last_trade_time?: string
          risk_status?: 'green' | 'amber' | 'red'
          session_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}