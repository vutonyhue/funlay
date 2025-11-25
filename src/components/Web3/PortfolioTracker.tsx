import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrendingUp, TrendingDown, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PortfolioTrackerProps {
  balances: Array<{
    symbol: string;
    balance: string;
    decimals: number;
  }>;
  prices: { [key: string]: number };
}

export const PortfolioTracker = ({ balances, prices }: PortfolioTrackerProps) => {
  // Calculate total portfolio value in USD
  const totalValue = balances.reduce((total, token) => {
    const balance = parseFloat(token.balance);
    const price = prices[token.symbol] || 0;
    return total + (balance * price);
  }, 0);

  // Calculate asset allocation for pie chart
  const allocationData = balances
    .map(token => {
      const balance = parseFloat(token.balance);
      const price = prices[token.symbol] || 0;
      const value = balance * price;
      return {
        name: token.symbol,
        value: value,
        percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      };
    })
    .filter(item => item.value > 0);

  const COLORS = {
    BNB: "#F3BA2F",
    USDT: "#26A17B",
    CAMLY: "#FF6B6B",
    BTC: "#F7931A",
  };

  // Mock P&L data (in production, this would come from transaction history)
  const mockProfitLoss = 124.50;
  const mockProfitLossPercent = 5.2;
  const isProfitable = mockProfitLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Total Portfolio Value */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Tổng giá trị ví</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-bold text-foreground">
              ${totalValue.toFixed(2)}
            </h2>
            <div className={`flex items-center gap-1 ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
              {isProfitable ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {isProfitable ? '+' : ''}{mockProfitLossPercent}%
              </span>
            </div>
          </div>
          <p className={`text-sm ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
            {isProfitable ? '+' : ''}{mockProfitLoss.toFixed(2)} USD (24h)
          </p>
        </div>
      </Card>

      {/* Asset Allocation Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Phân bổ tài sản</h3>
        {allocationData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#8884d8"} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => `$${value.toFixed(2)}`}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-center text-muted-foreground py-12">
            Chưa có tài sản nào trong ví
          </p>
        )}
      </Card>

      {/* P&L History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Lịch sử Lãi/Lỗ</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">24 giờ</p>
              <p className="text-xs text-muted-foreground">Hôm nay</p>
            </div>
            <div className="text-right">
              <p className={`font-semibold ${isProfitable ? 'text-green-500' : 'text-red-500'}`}>
                {isProfitable ? '+' : ''}{mockProfitLoss.toFixed(2)} USD
              </p>
              <p className="text-xs text-muted-foreground">
                {isProfitable ? '+' : ''}{mockProfitLossPercent}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">7 ngày</p>
              <p className="text-xs text-muted-foreground">Tuần này</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-500">+342.80 USD</p>
              <p className="text-xs text-muted-foreground">+12.3%</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium">30 ngày</p>
              <p className="text-xs text-muted-foreground">Tháng này</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-green-500">+1,247.60 USD</p>
              <p className="text-xs text-muted-foreground">+45.2%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Price Alerts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Cảnh báo giá</h3>
          <Button size="sm" variant="outline">
            <Bell className="h-4 w-4 mr-2" />
            Thêm cảnh báo
          </Button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">BNB</Badge>
              <div>
                <p className="text-sm font-medium">Khi giá {'>'} $650</p>
                <p className="text-xs text-muted-foreground">Giá hiện tại: ${prices.BNB?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
            <Badge variant="outline">Đang chờ</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant="secondary">BTC</Badge>
              <div>
                <p className="text-sm font-medium">Khi giá {'<'} $95,000</p>
                <p className="text-xs text-muted-foreground">Giá hiện tại: ${prices.BTC?.toLocaleString() || '0'}</p>
              </div>
            </div>
            <Badge variant="outline">Đang chờ</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
