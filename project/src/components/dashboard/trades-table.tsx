'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchedTrade } from '@/types/database';
import { formatCurrency, formatPercentage, formatDuration } from '@/lib/utils';
import { TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface TradesTableProps {
  trades: MatchedTrade[];
}

export function TradesTable({ trades }: TradesTableProps) {
  if (trades.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No trades found. Upload your trading data to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-3 text-sm font-medium text-gray-600">Symbol</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Qty</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Buy Price</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Sell Price</th>
                <th className="pb-3 text-sm font-medium text-gray-600">P&L</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Return</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Duration</th>
                <th className="pb-3 text-sm font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((trade) => (
                <tr key={trade.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3">
                    <div className="font-medium text-gray-900">{trade.symbol}</div>
                  </td>
                  <td className="py-3 text-gray-600">{trade.quantity}</td>
                  <td className="py-3 text-gray-600">
                    {formatCurrency(trade.buy_price)}
                  </td>
                  <td className="py-3 text-gray-600">
                    {formatCurrency(trade.sell_price)}
                  </td>
                  <td className="py-3">
                    <div className={`flex items-center gap-1 ${
                      trade.pnl >= 0 ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {trade.pnl >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {formatCurrency(trade.pnl)}
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trade.pnl_pct >= 0
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {formatPercentage(trade.pnl_pct)}
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">
                    {formatDuration(trade.duration)}
                  </td>
                  <td className="py-3 text-gray-600">
                    {format(new Date(trade.sell_datetime), 'MMM dd, yy')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}