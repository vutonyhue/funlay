import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { usePriceChart } from "@/hooks/usePriceChart";
import { Loader2 } from "lucide-react";

interface PriceChartProps {
  tokenSymbol: string;
  tokenName: string;
}

export const PriceChart = ({ tokenSymbol, tokenName }: PriceChartProps) => {
  const [period, setPeriod] = useState<"24h" | "7d" | "30d">("24h");
  const { chartData, loading } = usePriceChart(tokenSymbol, period);

  const formatXAxis = (timestamp: number) => {
    const date = new Date(timestamp);
    if (period === "24h") {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString("vi-VN", { month: "short", day: "numeric" });
  };

  const formatTooltip = (value: number) => {
    return `$${value.toFixed(tokenSymbol === "BTC" ? 2 : 6)}`;
  };

  if (tokenSymbol === "CAMLY") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Biểu đồ giá {tokenName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Biểu đồ giá không khả dụng cho CAMLY (token tùy chỉnh)
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Biểu đồ giá {tokenName}</CardTitle>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="7d">7 ngày</TabsTrigger>
            <TabsTrigger value="30d">30 ngày</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-muted-foreground">Không có dữ liệu</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatXAxis}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis
                tickFormatter={(v) => `$${v.toFixed(tokenSymbol === "BTC" ? 0 : 4)}`}
                stroke="hsl(var(--muted-foreground))"
              />
              <Tooltip
                formatter={formatTooltip}
                labelFormatter={(label) => new Date(label).toLocaleString("vi-VN")}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
