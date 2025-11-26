import { useState, useEffect } from "react";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getWeb3Modal } from "@/lib/web3Config";
import { getAccount, watchAccount, switchChain, getConnectors } from '@wagmi/core';
import { wagmiConfig } from '@/lib/web3Config';
import { bsc } from '@wagmi/core/chains';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const WalletButton = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>("");
  const [walletType, setWalletType] = useState<string>("");
  const { toast } = useToast();
  const [isInitialized, setIsInitialized] = useState(false);
  const { user } = useAuth();

  // Initialize Web3Modal and watch for account changes
  useEffect(() => {
    const initWeb3 = async () => {
      try {
        getWeb3Modal();
        
        // Check initial connection
        const account = getAccount(wagmiConfig);
        if (account.address && account.isConnected) {
          setAddress(account.address);
          setIsConnected(true);
          
          // Get wallet type
          const connectors = getConnectors(wagmiConfig);
          const activeConnector = connectors.find(c => c.id === account.connector?.id);
          const walletName = activeConnector?.name || "Unknown";
          setWalletType(walletName);
          
          // Save to database if user is logged in
          if (user) {
            await supabase
              .from("profiles")
              .update({ 
                wallet_address: account.address,
                wallet_type: walletName
              })
              .eq("id", user.id);
          }
          
          // Ensure BSC chain
          if (account.chainId !== bsc.id) {
            await switchChain(wagmiConfig, { chainId: bsc.id });
          }
        } else if (user) {
          // Auto-reconnect if user previously connected
          const { data: profile } = await supabase
            .from("profiles")
            .select("wallet_address, wallet_type")
            .eq("id", user.id)
            .single();
          
          if (profile?.wallet_address && profile?.wallet_type) {
            // Try to auto-connect
            try {
              const modal = getWeb3Modal();
              if (modal) {
                // Check if already connected in background
                const account = getAccount(wagmiConfig);
                if (account.address && account.isConnected) {
                  setAddress(account.address);
                  setIsConnected(true);
                  setWalletType(profile.wallet_type);
                }
              }
            } catch (error) {
              console.error("Auto-reconnect error:", error);
            }
          }
        }
        
        setIsInitialized(true);
      } catch (error) {
        console.error("Web3 init error:", error);
        setIsInitialized(true);
      }
    };

    initWeb3();

    // Watch for account changes
    const unwatch = watchAccount(wagmiConfig, {
      onChange: async (account) => {
        if (account.address && account.isConnected) {
          setAddress(account.address);
          setIsConnected(true);
          
          // Get wallet type
          const connectors = getConnectors(wagmiConfig);
          const activeConnector = connectors.find(c => c.id === account.connector?.id);
          const walletName = activeConnector?.name || "Unknown";
          setWalletType(walletName);
          
          // Save to database if user is logged in
          if (user) {
            await supabase
              .from("profiles")
              .update({ 
                wallet_address: account.address,
                wallet_type: walletName
              })
              .eq("id", user.id);
          }
          
          // Auto-switch to BSC if needed
          if (account.chainId !== bsc.id) {
            switchChain(wagmiConfig, { chainId: bsc.id }).catch(console.error);
          }
        } else {
          setAddress("");
          setIsConnected(false);
          setWalletType("");
          
          // Clear from database if user disconnects
          if (user) {
            await supabase
              .from("profiles")
              .update({ 
                wallet_address: null,
                wallet_type: null
              })
              .eq("id", user.id);
          }
        }
      },
    });

    return () => unwatch();
  }, [user]);

  const connectWallet = async () => {
    try {
      const modal = getWeb3Modal();
      if (modal) {
        await modal.open();
        
        toast({
          title: "Kết nối ví",
          description: "Chọn MetaMask hoặc Bitget Wallet để kết nối",
        });
      }
    } catch (error: any) {
      toast({
        title: "Lỗi kết nối",
        description: error.message || "Không thể kết nối ví",
        variant: "destructive",
      });
    }
  };

  const disconnectWallet = async () => {
    try {
      const modal = getWeb3Modal();
      if (modal) {
        await modal.open();
      }
      
      toast({
        title: "Ngắt kết nối ví",
        description: "Ví của bạn đã được ngắt kết nối",
      });
    } catch (error) {
      console.error("Disconnect error:", error);
    }
  };

  if (!isInitialized) {
    return (
      <Button
        disabled
        size="sm"
        className="gap-2"
      >
        <Wallet className="h-4 w-4 animate-pulse" />
        <span className="hidden md:inline">Đang tải...</span>
      </Button>
    );
  }

  if (isConnected) {
    // Get wallet icon
    const walletIcon = walletType.toLowerCase().includes("metamask") 
      ? "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg"
      : walletType.toLowerCase().includes("bitget")
      ? "https://img.cryptorank.io/exchanges/bitget1663580368976.png"
      : null;
    
    return (
      <Button
        onClick={disconnectWallet}
        variant="outline"
        size="sm"
        className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
      >
        {walletIcon ? (
          <img src={walletIcon} alt={walletType} className="h-4 w-4 rounded-full" />
        ) : (
          <Wallet className="h-4 w-4" />
        )}
        <span className="hidden md:inline">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </Button>
    );
  }

  return (
    <Button
      onClick={connectWallet}
      size="sm"
      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
    >
      <Wallet className="h-4 w-4" />
      <span className="hidden md:inline">Kết nối ví</span>
    </Button>
  );
};

