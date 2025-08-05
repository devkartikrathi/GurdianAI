import { RawTrade, MatchedTrade } from '@/types/database';
import { differenceInMinutes, differenceInDays } from 'date-fns';

export class TradeMatcher {
  static matchTrades(rawTrades: RawTrade[]): {
    matchedTrades: Omit<MatchedTrade, 'id' | 'created_at'>[];
    openPositions: any[];
  } {
    const groupedBySymbol = this.groupTradesBySymbol(rawTrades);
    const matchedTrades: Omit<MatchedTrade, 'id' | 'created_at'>[] = [];
    const openPositions: any[] = [];

    Object.entries(groupedBySymbol).forEach(([symbol, trades]) => {
      const { matched, open } = this.matchSymbolTrades(symbol, trades);
      matchedTrades.push(...matched);
      openPositions.push(...open);
    });

    return { matchedTrades, openPositions };
  }

  private static groupTradesBySymbol(trades: RawTrade[]): Record<string, RawTrade[]> {
    return trades.reduce((groups, trade) => {
      const symbol = trade.symbol.toUpperCase();
      if (!groups[symbol]) {
        groups[symbol] = [];
      }
      groups[symbol].push(trade);
      return groups;
    }, {} as Record<string, RawTrade[]>);
  }

  private static matchSymbolTrades(symbol: string, trades: RawTrade[]): {
    matched: Omit<MatchedTrade, 'id' | 'created_at'>[];
    open: any[];
  } {
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.trade_datetime).getTime() - new Date(b.trade_datetime).getTime()
    );

    const buyStack: RawTrade[] = [];
    const matched: Omit<MatchedTrade, 'id' | 'created_at'>[] = [];
    const open: any[] = [];

    for (const trade of sortedTrades) {
      if (trade.trade_type === 'BUY') {
        buyStack.push(trade);
      } else if (trade.trade_type === 'SELL') {
        let remainingQuantity = trade.quantity;
        
        while (remainingQuantity > 0 && buyStack.length > 0) {
          const buyTrade = buyStack[0];
          const matchQuantity = Math.min(remainingQuantity, buyTrade.quantity);
          
          // Create matched trade
          const matchedTrade = this.createMatchedTrade(
            buyTrade,
            trade,
            matchQuantity,
            symbol
          );
          matched.push(matchedTrade);
          
          // Update quantities
          remainingQuantity -= matchQuantity;
          buyTrade.quantity -= matchQuantity;
          
          if (buyTrade.quantity === 0) {
            buyStack.shift();
          }
        }
        
        // If there's remaining sell quantity, it might be a short position
        // For simplicity, we'll ignore short positions in this implementation
      }
    }

    // Add remaining buy positions as open positions
    buyStack.forEach(buyTrade => {
      if (buyTrade.quantity > 0) {
        open.push({
          user_id: buyTrade.user_id,
          symbol: symbol,
          quantity: buyTrade.quantity,
          buy_price: buyTrade.price,
          buy_datetime: buyTrade.trade_datetime
        });
      }
    });

    return { matched, open };
  }

  private static createMatchedTrade(
    buyTrade: RawTrade,
    sellTrade: RawTrade,
    quantity: number,
    symbol: string
  ): Omit<MatchedTrade, 'id' | 'created_at'> {
    const buyPrice = buyTrade.price;
    const sellPrice = sellTrade.price;
    const pnl = (sellPrice - buyPrice) * quantity;
    const pnlPct = ((sellPrice - buyPrice) / buyPrice) * 100;
    
    const buyDateTime = new Date(buyTrade.trade_datetime);
    const sellDateTime = new Date(sellTrade.trade_datetime);
    const durationMinutes = differenceInMinutes(sellDateTime, buyDateTime);
    
    return {
      user_id: buyTrade.user_id,
      symbol,
      quantity,
      buy_price: buyPrice,
      sell_price: sellPrice,
      pnl: Math.round(pnl * 100) / 100,
      pnl_pct: Math.round(pnlPct * 100) / 100,
      buy_datetime: buyTrade.trade_datetime,
      sell_datetime: sellTrade.trade_datetime,
      duration: `${durationMinutes} minutes`,
      trade_session_date: buyDateTime.toISOString().split('T')[0]
    };
  }

  static calculatePerformanceMetrics(matchedTrades: MatchedTrade[]) {
    if (matchedTrades.length === 0) {
      return {
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0,
        win_rate: 0,
        total_pnl: 0,
        average_win: 0,
        average_loss: 0,
        profit_factor: 0,
        max_drawdown: 0,
        sharpe_ratio: 0
      };
    }

    const totalTrades = matchedTrades.length;
    const winningTrades = matchedTrades.filter(t => t.pnl > 0);
    const losingTrades = matchedTrades.filter(t => t.pnl < 0);
    
    const totalPnl = matchedTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    
    const winRate = (winningTrades.length / totalTrades) * 100;
    const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
    
    // Calculate maximum drawdown
    const maxDrawdown = this.calculateMaxDrawdown(matchedTrades);
    
    // Calculate Sharpe ratio (simplified)
    const returns = matchedTrades.map(t => t.pnl_pct);
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnStdDev = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    const sharpeRatio = returnStdDev > 0 ? (avgReturn / returnStdDev) * Math.sqrt(252) : 0;

    return {
      total_trades: totalTrades,
      winning_trades: winningTrades.length,
      losing_trades: losingTrades.length,
      win_rate: Math.round(winRate * 100) / 100,
      total_pnl: Math.round(totalPnl * 100) / 100,
      average_win: Math.round(averageWin * 100) / 100,
      average_loss: Math.round(averageLoss * 100) / 100,
      profit_factor: Math.round(profitFactor * 100) / 100,
      max_drawdown: Math.round(maxDrawdown * 100) / 100,
      sharpe_ratio: Math.round(sharpeRatio * 100) / 100
    };
  }

  private static calculateMaxDrawdown(trades: MatchedTrade[]): number {
    const sortedTrades = [...trades].sort((a, b) => 
      new Date(a.sell_datetime).getTime() - new Date(b.sell_datetime).getTime()
    );

    let peak = 0;
    let maxDrawdown = 0;
    let runningPnl = 0;

    for (const trade of sortedTrades) {
      runningPnl += trade.pnl;
      
      if (runningPnl > peak) {
        peak = runningPnl;
      }
      
      const drawdown = peak - runningPnl;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }
}