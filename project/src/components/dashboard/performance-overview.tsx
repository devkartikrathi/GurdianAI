'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Target, Clock } from 'lucide-react';
import { formatCurrency, formatPercentage, getRiskStatusColor } from '@/lib/utils';
import { PerformanceMetrics } from '@/types/trading';

interface PerformanceOverviewProps {
  metrics: PerformanceMetrics;
  riskStatus: 'green' | 'amber' | 'red';
}

export function PerformanceOverview({ metrics, riskStatus }: PerformanceOverviewProps) {
  const performanceCards = [
    {
      title: 'Total P&L',
      value: formatCurrency(metrics.total_pnl),
      icon: metrics.total_pnl >= 0 ? TrendingUp : TrendingDown,
      color: metrics.total_pnl >= 0 ? 'text-emerald-600' : 'text-red-600',
      bgColor: metrics.total_pnl >= 0 ? 'bg-emerald-50' : 'bg-red-50',
    },
    {
      title: 'Win Rate',
      value: formatPercentage(metrics.win_rate),
      icon: Target,
      color: metrics.win_rate >= 60 ? 'text-emerald-600' : metrics.win_rate >= 40 ? 'text-amber-600' : 'text-red-600',
      bgColor: metrics.win_rate >= 60 ? 'bg-emerald-50' : metrics.win_rate >= 40 ? 'bg-amber-50' : 'bg-red-50',
    },
    {
      title: 'Total Trades',
      value: metrics.total_trades.toString(),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Profit Factor',
      value: metrics.profit_factor.toFixed(2),
      icon: TrendingUp,
      color: metrics.profit_factor >= 1.5 ? 'text-emerald-600' : metrics.profit_factor >= 1 ? 'text-amber-600' : 'text-red-600',
      bgColor: metrics.profit_factor >= 1.5 ? 'bg-emerald-50' : metrics.profit_factor >= 1 ? 'bg-amber-50' : 'bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Risk Status Banner */}
      <div className={`rounded-lg border p-4 ${getRiskStatusColor(riskStatus)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Guardian AI Status</h3>
            <p className="text-sm opacity-90">
              {riskStatus === 'green' && 'All systems green. Trading within safe parameters.'}
              {riskStatus === 'amber' && 'Caution advised. Monitor your risk levels closely.'}
              {riskStatus === 'red' && 'High risk detected. Consider reducing position sizes.'}
            </p>
          </div>
          <div className={`w-3 h-3 rounded-full ${
            riskStatus === 'green' ? 'bg-emerald-500' : 
            riskStatus === 'amber' ? 'bg-amber-500' : 'bg-red-500'
          } animate-pulse`} />
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceCards.map((card, index) => (
          <Card key={index} className="transition-all duration-200 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Max Drawdown</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(metrics.max_drawdown)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Sharpe Ratio</span>
              <span className="font-semibold">
                {metrics.sharpe_ratio.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Win</span>
              <span className="font-semibold text-emerald-600">
                {formatCurrency(metrics.average_win)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Average Loss</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(metrics.average_loss)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trade Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Winning Trades</span>
              <span className="font-semibold text-emerald-600">
                {metrics.winning_trades}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Losing Trades</span>
              <span className="font-semibold text-red-600">
                {metrics.losing_trades}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${metrics.win_rate}%` }}
              />
            </div>
            <div className="text-xs text-center text-gray-500">
              Win Rate: {formatPercentage(metrics.win_rate)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}