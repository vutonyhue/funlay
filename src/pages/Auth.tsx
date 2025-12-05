import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Play, ArrowLeft, Eye, EyeOff, Mail } from "lucide-react";
import { User, Session } from "@supabase/supabase-js";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            display_name: displayName || email.split("@")[0],
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Account Created",
        description: "Welcome to FUN PLAY!",
      });
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "Failed to create account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Failed to log in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Google Login Failed",
        description: error.message || "Failed to log in with Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    setWalletLoading(true);
    
    try {
      const ethereum = (window as any).ethereum;
      
      if (!ethereum) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          const dappUrl = encodeURIComponent(window.location.href);
          window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
          return;
        }
        
        toast({
          title: "Wallet Not Found",
          description: "Please install MetaMask extension first.",
          variant: "destructive",
        });
        setWalletLoading(false);
        return;
      }

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const walletAddress = accounts[0];

      // Switch to BSC
      try {
        await ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x38' }],
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
              rpcUrls: ['https://bsc-dataseed.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/'],
            }],
          });
        }
      }

      const isBitget = ethereum.isBitKeep || ethereum.isBitget;
      const detectedWalletType = isBitget ? 'Bitget' : 'MetaMask';
        
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('wallet_address', walletAddress)
        .single();

      if (existingProfile) {
        const walletEmail = `${walletAddress.toLowerCase()}@wallet.funplay.local`;
        
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: walletEmail,
          password: walletAddress,
        });

        if (signInError) {
          localStorage.setItem('pendingWalletAddress', walletAddress);
          toast({
            title: "Welcome back!",
            description: "You're now logged in.",
          });
          setTimeout(() => navigate("/"), 500);
        }
      } else {
        const walletEmail = `${walletAddress.toLowerCase()}@wallet.funplay.local`;
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: walletEmail,
          password: walletAddress,
          options: {
            data: {
              display_name: `Wallet ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
              wallet_address: walletAddress,
            },
          },
        });

        if (signUpError) {
          const { error: retrySignIn } = await supabase.auth.signInWithPassword({
            email: walletEmail,
            password: walletAddress,
          });
          
          if (retrySignIn) {
            throw retrySignIn;
          }
        }

        if (signUpData?.user) {
          await supabase
            .from('profiles')
            .update({ 
              wallet_address: walletAddress,
              wallet_type: detectedWalletType
            })
            .eq('id', signUpData.user.id);
        }
      }
    } catch (error: any) {
      console.error("Wallet login error:", error);
      toast({
        title: "Wallet Login Failed",
        description: error.message || "Failed to connect wallet",
        variant: "destructive",
      });
    } finally {
      setWalletLoading(false);
    }
  };

  const handleContinueWithoutLogin = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Video Background */}
      <div className="fixed inset-0 overflow-hidden -z-20">
        <video
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover object-center"
        >
          <source src="/videos/heartbeat-bg.mp4" type="video/mp4" />
        </video>
      </div>
      
      {/* Gradient Overlay */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[rgba(138,43,226,0.4)] via-[rgba(255,0,150,0.2)] to-[rgba(0,231,255,0.3)]" />

      {/* Back Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 text-white hover:bg-white/20"
      >
        <ArrowLeft className="h-6 w-6" />
      </Button>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="flex items-center gap-3 bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] px-6 py-3 rounded-2xl shadow-2xl">
            <Play className="h-10 w-10 text-white fill-white" />
            <div className="text-3xl font-bold text-white tracking-wider">
              FUN PLAY
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-center mb-6 text-white drop-shadow-lg">
            Welcome Back
          </h2>

          {/* Wallet & Google Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              onClick={handleWalletLogin}
              disabled={walletLoading}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-3 bg-gradient-to-r from-[#F6851B] via-[#E2761B] to-[#CD6116] hover:opacity-90 transition-opacity"
            >
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" 
                alt="MetaMask" 
                className="h-6 w-6" 
              />
              <span className="text-white font-semibold">
                {walletLoading ? "Connecting..." : "Connect with MetaMask"}
              </span>
            </Button>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-12 rounded-xl flex items-center justify-center gap-3 bg-gradient-to-r from-[#4285F4] via-[#34A853] via-[#FBBC05] to-[#EA4335] hover:opacity-90 transition-opacity"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="white" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="white" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="white" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="white" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-white font-semibold">
                Continue with Google
              </span>
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/30" />
            <span className="text-white/60 text-sm">or continue with email</span>
            <div className="flex-1 h-px bg-white/30" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={isLogin ? handleLogin : handleSignUp} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="displayName" className="text-white/80">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1 h-12 bg-white/90 border-white/30 text-gray-800 placeholder:text-gray-400 rounded-xl"
                />
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 pl-10 bg-white/90 border-white/30 text-gray-800 placeholder:text-gray-400 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10 bg-white/90 border-white/30 text-gray-800 placeholder:text-gray-400 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF6B6B] via-[#FF8E53] to-[#FFD93D] hover:opacity-90 transition-opacity"
            >
              {loading ? "Loading..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>

          {/* Continue without login */}
          <Button
            type="button"
            variant="outline"
            onClick={handleContinueWithoutLogin}
            className="w-full h-12 mt-4 rounded-xl border-white/30 bg-white/10 text-[#00E7FF] hover:bg-white/20 font-semibold"
          >
            Continue without login
          </Button>

          {/* Toggle Login/Signup */}
          <p className="text-center mt-6 text-white/80">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#00E7FF] hover:text-[#00E7FF]/80 font-semibold underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        {/* Footer Note */}
        <p className="text-center text-white/50 text-sm">
          Web3 features require wallet connection. Basic features work without login.
        </p>
      </div>
    </div>
  );
}
