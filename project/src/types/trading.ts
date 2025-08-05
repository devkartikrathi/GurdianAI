export interface CSVColumn {
  name: string;
  type: 'string' | 'number' | 'date';
  sample_values: string[];
}

export interface CSVSchema {
  columns: CSVColumn[];
  suggested_mapping: Record<string, string>;
  confidence_score: number;
}

export interface TradeUploadResult {
  success: boolean;
  trade_book_id?: string;
  total_trades: number;
  matched_trades: number;
  open_positions: number;
  errors?: string[];
}

export interface PerformanceMetrics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate: number;
  total_pnl: number;
  average_win: number;
  average_loss: number;
  profit_factor: number;
  max_drawdown: number;
  sharpe_ratio: number;
}

export interface EmotionalZone {
  hour: number;
  trades_count: number;
  avg_pnl: number;
  win_rate: number;
  emotional_score: 'positive' | 'neutral' | 'negative';
}

export interface RiskAssessment {
  current_status: 'green' | 'amber' | 'red';
  risk_score: number;
  recommendations: string[];
  warnings: string[];
  position_size_suggestion?: number;
}