import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Sparkles, CheckCircle2, Copy, ExternalLink, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import confetti from "canvas-confetti";

interface RewardClaimSectionProps {
  userId: string;
  isOwnProfile?: boolean;
}

export const RewardClaimSection = ({ userId, isOwnProfile = false }: RewardClaimSectionProps) => {
  const [totalRewards, setTotalRewards] = useState(0);
  const [claimableBalance, setClaimableBalance] = useState(0);
  const [isKYCVerified, setIsKYCVerified] = useState(false); // Mock KYC status
  const [walletAddress, setWalletAddress] = useState("");
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [claimStep, setClaimStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [inputWallet, setInputWallet] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchRewardData();
  }, [userId]);

  const fetchRewardData = async () => {
    try {
      const { data: profileData } = await supabase
        .from("profiles")
        .select("total_camly_rewards, wallet_address")
        .eq("id", userId)
        .single();

      if (profileData) {
        setTotalRewards(profileData.total_camly_rewards || 0);
        setClaimableBalance(profileData.total_camly_rewards || 0); // For demo, claimable = total
        setWalletAddress(profileData.wallet_address || "");
        setInputWallet(profileData.wallet_address || "");
        // Mock KYC - in production, check actual KYC status
        setIsKYCVerified(true);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching reward data:", error);
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!inputWallet || !/^0x[a-fA-F0-9]{40}$/.test(inputWallet)) {
      toast({
        title: "Invalid Wallet",
        description: "Please enter a valid BSC wallet address",
        variant: "destructive",
      });
      return;
    }

    if (claimStep === 'input') {
      setClaimStep('confirm');
      return;
    }

    setClaiming(true);
    
    // Simulate claim process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Trigger success animation
    triggerSuccessAnimation();
    setClaimStep('success');
    setClaiming(false);

    toast({
      title: "Claim Submitted!",
      description: `Your CAMLY rewards will be sent to ${inputWallet.slice(0, 6)}...${inputWallet.slice(-4)}`,
    });
  };

  const triggerSuccessAnimation = () => {
    // Play success sound
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3");
    audio.volume = 0.5;
    audio.play().catch(() => {});

    // Confetti explosion
    const colors = ['#ffd700', '#ff9500', '#00e7ff', '#7a2bff', '#ff00e5'];
    
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors,
    });

    setTimeout(() => {
      confetti({
        particleCount: 80,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.8 },
        colors,
      });
      confetti({
        particleCount: 80,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.8 },
        colors,
      });
    }, 300);
  };

  const resetModal = () => {
    setShowClaimModal(false);
    setTimeout(() => {
      setClaimStep('input');
    }, 300);
  };

  if (loading) {
    return (
      <div className="animate-pulse h-48 rounded-3xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 mb-6" />
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="relative overflow-hidden rounded-3xl mb-6"
      >
        {/* Rainbow breathing outer glow */}
        <motion.div
          className="absolute -inset-[2px] rounded-3xl opacity-60"
          style={{
            background: `linear-gradient(90deg, 
              #ff0080, #ff8c00, #ffd700, #00ff00, #00e7ff, #7a2bff, #ff00e5, #ff0080
            )`,
            backgroundSize: '400% 100%',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            backgroundPosition: { duration: 8, repeat: Infinity, ease: "linear" },
            opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        
        {/* 3D Metallic Gold Border */}
        <div 
          className="absolute inset-0 rounded-3xl"
          style={{
            background: `linear-gradient(145deg, 
              #ffd700 0%, #b8860b 15%, #ffeaa7 30%, #daa520 45%, 
              #ffd700 50%, #b8860b 65%, #ffeaa7 80%, #daa520 90%, #ffd700 100%
            )`,
            padding: '3px',
          }}
        >
          <div 
            className="w-full h-full rounded-3xl"
            style={{
              background: 'linear-gradient(135deg, rgba(26,10,46,0.95) 0%, rgba(13,0,21,0.98) 50%, rgba(26,10,46,0.95) 100%)',
            }}
          />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{
                opacity: [0, 0.8, 0],
                scale: [0.5, 1, 0.5],
                y: [0, -20, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
            >
              <Sparkles className="w-3 h-3 text-yellow-400/60" />
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Total Reward - Huge Golden Number */}
            <div className="flex-1 text-center lg:text-left">
              <div className="text-sm font-semibold text-amber-300/70 mb-2 uppercase tracking-wider">
                ✦ Total Rewards Earned ✦
              </div>
              <motion.div
                className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight"
                style={{
                  background: `linear-gradient(135deg, 
                    #ffd700 0%, #fff8dc 20%, #ffd700 40%, 
                    #daa520 60%, #ffd700 80%, #fff8dc 100%
                  )`,
                  backgroundSize: '200% 200%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 4px 8px rgba(255,215,0,0.4)) drop-shadow(0 0 40px rgba(255,215,0,0.3))',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              >
                <CounterAnimation value={totalRewards} decimals={0} />
              </motion.div>
              <div 
                className="text-lg font-bold mt-1"
                style={{
                  background: 'linear-gradient(90deg, #ffd700, #ffa500)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                CAMLY
              </div>
            </div>

            {/* Claimable Balance - Green (only show if KYC verified) */}
            {isKYCVerified && (
              <motion.div 
                className="flex-1 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-sm font-semibold text-emerald-300/70 mb-2 uppercase tracking-wider">
                  ✦ Claimable Balance ✦
                </div>
                <motion.div
                  className="text-4xl md:text-5xl font-black tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #34d399, #6ee7b7, #34d399, #10b981)',
                    backgroundSize: '200% 200%',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 4px 8px rgba(16,185,129,0.4)) drop-shadow(0 0 30px rgba(16,185,129,0.3))',
                  }}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                  <CounterAnimation value={claimableBalance} decimals={0} />
                </motion.div>
                <div className="text-md font-bold text-emerald-400 mt-1">
                  CAMLY
                </div>
              </motion.div>
            )}

            {/* CLAIM Button - Huge Central */}
            {isOwnProfile && (
              <div className="flex-1 flex justify-center lg:justify-end">
                <motion.button
                  onClick={() => setShowClaimModal(true)}
                  disabled={claimableBalance <= 0}
                  className="relative group disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {/* Button glow effect */}
                  <div 
                    className="absolute -inset-2 rounded-2xl opacity-75 group-hover:opacity-100 blur-xl transition-opacity"
                    style={{
                      background: 'linear-gradient(135deg, #ffd700, #ff9500, #ffd700)',
                    }}
                  />
                  
                  {/* Button */}
                  <div 
                    className="relative px-10 py-5 rounded-2xl font-black text-xl uppercase tracking-wider flex items-center gap-3"
                    style={{
                      background: 'linear-gradient(135deg, #ffd700 0%, #ff9500 50%, #ffd700 100%)',
                      boxShadow: `
                        0 10px 40px rgba(255,165,0,0.5),
                        inset 0 2px 10px rgba(255,255,255,0.4),
                        inset 0 -2px 10px rgba(0,0,0,0.2)
                      `,
                      color: '#1a0a2e',
                    }}
                  >
                    <Wallet className="w-6 h-6" />
                    <span>CLAIM</span>
                    <Coins className="w-6 h-6" />
                  </div>

                  {/* Orbiting sparkles */}
                  <motion.div
                    className="absolute -top-2 -right-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                  </motion.div>
                </motion.button>
              </div>
            )}
          </div>

          {/* KYC Notice if not verified */}
          {!isKYCVerified && isOwnProfile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center"
            >
              <p className="text-amber-300 font-medium">
                ⚠️ Complete KYC verification to unlock claiming rewards
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Claim Modal */}
      <Dialog open={showClaimModal} onOpenChange={resetModal}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#1a0a2e] to-[#0d0015] border-2 border-amber-500/30">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
              {claimStep === 'success' ? '🎉 Claim Successful!' : 'Claim CAMLY Rewards'}
            </DialogTitle>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {claimStep === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center py-4">
                  <div className="text-3xl font-black text-amber-400 mb-2">
                    {claimableBalance.toLocaleString()} CAMLY
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter your BSC wallet address to receive rewards
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-amber-300">Wallet Address</label>
                  <Input
                    value={inputWallet}
                    onChange={(e) => setInputWallet(e.target.value)}
                    placeholder="0x..."
                    className="font-mono bg-black/30 border-amber-500/30 focus:border-amber-400"
                  />
                </div>

                <Button
                  onClick={handleClaim}
                  className="w-full py-6 text-lg font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400"
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {claimStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-xl bg-black/30 border border-amber-500/20 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-bold text-amber-400">{claimableBalance.toLocaleString()} CAMLY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To Wallet</span>
                    <span className="font-mono text-sm text-emerald-400">
                      {inputWallet.slice(0, 8)}...{inputWallet.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network</span>
                    <span className="font-medium text-yellow-400">BSC Mainnet</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setClaimStep('input')}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400"
                  >
                    {claiming ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      "Confirm Claim"
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {claimStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6 space-y-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: 0.2 }}
                >
                  <CheckCircle2 className="w-20 h-20 mx-auto text-emerald-400" />
                </motion.div>
                
                <div className="text-2xl font-bold text-emerald-400">
                  {claimableBalance.toLocaleString()} CAMLY
                </div>
                
                <p className="text-muted-foreground">
                  Your rewards will be sent to your wallet shortly!
                </p>

                <div className="flex items-center justify-center gap-2 text-sm text-amber-400">
                  <span className="font-mono">{inputWallet.slice(0, 10)}...{inputWallet.slice(-8)}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => navigator.clipboard.writeText(inputWallet)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => window.open(`https://bscscan.com/address/${inputWallet}`, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </div>

                <Button onClick={resetModal} className="w-full mt-4">
                  Done
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};
