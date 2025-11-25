import { useState, useEffect } from "react";

export interface PriceChartData {
  timestamp: number;
  price: number;
}

type TimePeriod = "24h" | "7d" | "30d";

const COINGECKO_IDS: { [key: string]: string } = {
  BNB: "binancecoin",
  USDT: "tether",
  BTC: "bitcoin",
};

export const usePriceChart = (tokenSymbol: string, period: TimePeriod = "24h") => {
  const [chartData, setChartData] = useState<PriceChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const coinId = COINGECKO_IDS[tokenSymbol];
        if (!coinId) {
          setChartData([]);
          setLoading(false);
          return;
        }

        const days = period === "24h" ? 1 : period === "7d" ? 7 : 30;
        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`
        );
        const data = await response.json();

        if (data.prices) {
          const formattedData: PriceChartData[] = data.prices.map(
            ([timestamp, price]: [number, number]) => ({
              timestamp,
              price,
            })
          );
          setChartData(formattedData);
        }
      } catch (error) {
        console.error("Error fetching chart data:", error);
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchChartData();
  }, [tokenSymbol, period]);

  return { chartData, loading };
};
