export interface User {
  id: string;
  clerk_user_id: string;
  email: string;
  name: string;
  total_capital: number;
  max_daily_drawdown_pct: number;
  max_consecutive_losses: number;
  risk_per_trade_pct: number;
  created_at: string;
  updated_at: string;
}

export interface TradeBook {
  id: string;
  user_id: string;
  file_name: string;
  file_size: number;
  upload_timestamp: string;
  parsed: boolean;
  total_rows: number;
  schema_mapping?: Record<string, string>;
}

export interface RawTrade {
  id: string;
  trade_book_id?: string;
  user_id: string;
  symbol: string;
  trade_type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  amount: number;
  trade_datetime: string;
  source: 'csv' | 'zerodha_api';
  created_at: string;
}

export interface MatchedTrade {
  id: string;
  user_id: string;
  symbol: string;
  quantity: number;
  buy_price: number;
  sell_price: number;
  pnl: number;
  pnl_pct: number;
  buy_datetime: string;
  sell_datetime: string;
  duration: string;
  trade_session_date: string;
  created_at: string;
}

export interface RiskSession {
  id: string;
  user_id: string;
  session_date: string;
  trades_count: number;
  current_pnl: number;
  current_drawdown_pct: number;
  consecutive_losses: number;
  last_trade_time?: string;
  risk_status: 'green' | 'amber' | 'red';
  session_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GuardianAIInsight {
  id: string;
  user_id: string;
  insight_type: 'overtrading' | 'emotional_zones' | 'win_loss_pattern' | 'time_performance' | 'symbol_bias';
  insight_data: Record<string, any>;
  confidence_score: number;
  trades_analyzed: number;
  created_at: string;
  updated_at: string;
}