import { Users, Video, Eye, MessageSquare, Coins, UserPlus, Crown } from "lucide-react";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { CounterAnimation } from "./CounterAnimation";
import { motion } from "framer-motion";

export const CompactHonobar = () => {
  const { stats, loading } = useHonobarStats();

  const statItems = [
    { icon: Users, label: "Người dùng", value: stats.totalUsers },
    { icon: Video, label: "Video", value: stats.totalVideos },
    { icon: Eye, label: "Lượt xem", value: stats.totalViews },
    { icon: MessageSquare, label: "Bình luận", value: stats.totalComments },
    { icon: Coins, label: "Phần thưởng", value: stats.totalRewards, decimals: 3, isCrypto: true },
    { icon: UserPlus, label: "Đăng ký", value: stats.totalSubscriptions },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="absolute top-3 right-3 z-20"
      >
        <div className="grid grid-cols-3 gap-1.5 p-2.5 rounded-xl bg-white/90 backdrop-blur-md border border-[#00E7FF]/30 shadow-lg">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gradient-to-br from-[#00E7FF]/20 to-[#FFD700]/20 rounded-lg h-12 w-16" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0, y: -10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ duration: 0.4, type: "spring" }}
      className="absolute top-3 right-3 z-20"
    >
      <div className="relative">
        {/* Subtle glow */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#00E7FF]/20 to-[#FFD700]/20 blur-md" />
        
        <div className="relative p-2.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#00E7FF]/40 shadow-[0_4px_20px_rgba(0,231,255,0.2)]">
          {/* Header */}
          <div className="flex items-center justify-center gap-1.5 mb-2 pb-1.5 border-b border-[#00E7FF]/20">
            <Crown className="w-3 h-3 text-[#FFD700]" />
            <span className="text-[10px] font-bold bg-gradient-to-r from-[#00E7FF] to-[#FFD700] bg-clip-text text-transparent tracking-wide">
              HONOR BOARD
            </span>
            <Crown className="w-3 h-3 text-[#FFD700]" />
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-1.5">
            {statItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.03, duration: 0.2 }}
                  className="relative"
                >
                  <div className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg bg-gradient-to-br from-[#00E7FF]/5 to-[#FFD700]/5 border border-[#00E7FF]/20 hover:border-[#FFD700]/40 transition-colors">
                    <div className="p-1 rounded-md bg-gradient-to-br from-[#00E7FF]/15 to-[#FFD700]/15">
                      <Icon className="w-3.5 h-3.5 text-[#00E7FF]" />
                    </div>
                    <span className="text-[8px] text-muted-foreground font-medium leading-none">
                      {item.label}
                    </span>
                    <span className="text-xs font-bold bg-gradient-to-r from-[#00E7FF] to-[#FFD700] bg-clip-text text-transparent tabular-nums leading-none">
                      <CounterAnimation value={item.value} decimals={item.decimals || 0} />
                      {item.isCrypto && <span className="text-[7px] ml-0.5 text-[#FFD700]">CAMLY</span>}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
