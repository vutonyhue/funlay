import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDownUp, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PANCAKESWAP_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)",
  "function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)"
];

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)"
];

interface Token {
  symbol: string;
  address: string;
  decimals: number;
  name: string;
}

const TOKENS: Token[] = [
  { symbol: "BNB", address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", decimals: 18, name: "Binance Coin" }, // WBNB
  { symbol: "USDT", address: "0x55d398326f99059fF775485246999027B3197955", decimals: 18, name: "Tether USD" },
  { symbol: "CAMLY", address: "0x5A4623F305A8d7904ED68638AF3B4328678edDBf", decimals: 9, name: "Camly Coin" },
  { symbol: "BTC", address: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", decimals: 18, name: "Bitcoin" }, // BTCB
];

export const TokenSwap = () => {
  const [fromToken, setFromToken] = useState<Token>(TOKENS[1]); // USDT
  const [toToken, setToToken] = useState<Token>(TOKENS[2]); // CAMLY
  const [fromAmount, setFromAmount] = useState("");
  const [toAmount, setToAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const { toast } = useToast();

  const calculateOutputAmount = async (inputAmount: string) => {
    if (!inputAmount || parseFloat(inputAmount) <= 0) {
      setToAmount("");
      return;
    }

    setIsCalculating(true);
    try {
      const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
      const router = new ethers.Contract(PANCAKESWAP_ROUTER, ROUTER_ABI, provider);

      const amountIn = ethers.parseUnits(inputAmount, fromToken.decimals);
      const path = [fromToken.address, toToken.address];

      const amounts = await router.getAmountsOut(amountIn, path);
      const outputAmount = ethers.formatUnits(amounts[1], toToken.decimals);
      setToAmount(outputAmount);
    } catch (error) {
      console.error("Error calculating output amount:", error);
      toast({
        title: "Lỗi tính toán",
        description: "Không thể tính toán số lượng token nhận được",
        variant: "destructive",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSwap = async () => {
    if (!window.ethereum || !fromAmount || !toAmount) return;

    setIsSwapping(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();

      // Check and approve token spending
      const tokenContract = new ethers.Contract(fromToken.address, ERC20_ABI, signer);
      const amountIn = ethers.parseUnits(fromAmount, fromToken.decimals);
      
      const allowance = await tokenContract.allowance(userAddress, PANCAKESWAP_ROUTER);
      if (allowance < amountIn) {
        toast({
          title: "Đang chấp thuận token...",
          description: "Vui lòng xác nhận trong MetaMask",
        });
        const approveTx = await tokenContract.approve(PANCAKESWAP_ROUTER, amountIn);
        await approveTx.wait();
      }

      // Execute swap
      const router = new ethers.Contract(PANCAKESWAP_ROUTER, ROUTER_ABI, signer);
      const path = [fromToken.address, toToken.address];
      const amountOutMin = ethers.parseUnits(
        (parseFloat(toAmount) * 0.95).toString(), // 5% slippage
        toToken.decimals
      );
      const deadline = Math.floor(Date.now() / 1000) + 60 * 20; // 20 minutes

      toast({
        title: "Đang hoán đổi...",
        description: "Vui lòng xác nhận giao dịch trong MetaMask",
      });

      const swapTx = await router.swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        userAddress,
        deadline
      );

      toast({
        title: "Đang xử lý...",
        description: "Giao dịch đang được xác nhận trên blockchain",
      });

      const receipt = await swapTx.wait();

      toast({
        title: "Hoán đổi thành công!",
        description: `Đã swap ${fromAmount} ${fromToken.symbol} sang ${toAmount} ${toToken.symbol}`,
      });

      // Reset form
      setFromAmount("");
      setToAmount("");
    } catch (error: any) {
      console.error("Swap error:", error);
      toast({
        title: "Lỗi hoán đổi",
        description: error.message || "Không thể hoán đổi token",
        variant: "destructive",
      });
    } finally {
      setIsSwapping(false);
    }
  };

  const handleSwitchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hoán đổi Token</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Từ</Label>
          <Select
            value={fromToken.symbol}
            onValueChange={(value) => {
              const token = TOKENS.find(t => t.symbol === value);
              if (token) setFromToken(token);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOKENS.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="0.0"
            value={fromAmount}
            onChange={(e) => {
              setFromAmount(e.target.value);
              calculateOutputAmount(e.target.value);
            }}
          />
        </div>

        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSwitchTokens}
            className="rounded-full"
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2">
          <Label>Sang</Label>
          <Select
            value={toToken.symbol}
            onValueChange={(value) => {
              const token = TOKENS.find(t => t.symbol === value);
              if (token) setToToken(token);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOKENS.map((token) => (
                <SelectItem key={token.symbol} value={token.symbol}>
                  {token.symbol} - {token.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="0.0"
            value={toAmount}
            readOnly
            disabled={isCalculating}
          />
        </div>

        <Button
          className="w-full"
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount || isSwapping || isCalculating}
        >
          {isSwapping ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang hoán đổi...
            </>
          ) : isCalculating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang tính toán...
            </>
          ) : (
            "Hoán đổi"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Sử dụng PancakeSwap Router v2 trên BSC
        </p>
      </CardContent>
    </Card>
  );
};
