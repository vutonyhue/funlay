import { Users, Video, Eye, MessageSquare, Coins, UserPlus } from "lucide-react";
import { useHonobarStats } from "@/hooks/useHonobarStats";
import { CounterAnimation } from "./CounterAnimation";
import { motion } from "framer-motion";

export const Honobar = () => {
  const { stats, loading } = useHonobarStats();

  const statItems = [
    {
      icon: Users,
      label: "Người dùng",
      labelEn: "Total Users",
      value: stats.totalUsers,
      color: "from-blue-400 to-cyan-400",
    },
    {
      icon: Video,
      label: "Video",
      labelEn: "Total Videos",
      value: stats.totalVideos,
      color: "from-purple-400 to-pink-400",
    },
    {
      icon: Eye,
      label: "Lượt xem",
      labelEn: "Total Views",
      value: stats.totalViews,
      color: "from-green-400 to-emerald-400",
    },
    {
      icon: MessageSquare,
      label: "Bình luận",
      labelEn: "Total Comments",
      value: stats.totalComments,
      color: "from-orange-400 to-red-400",
    },
    {
      icon: Coins,
      label: "Phần thưởng",
      labelEn: "Total Rewards",
      value: stats.totalRewards,
      color: "from-yellow-400 to-amber-400",
      decimals: 3,
      isCrypto: true,
    },
    {
      icon: UserPlus,
      label: "Đăng ký",
      labelEn: "Channel Subs",
      value: stats.totalSubscriptions,
      color: "from-indigo-400 to-violet-400",
    },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="absolute top-4 right-4 z-20"
      >
        <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/90 backdrop-blur-xl border-2 border-primary/30">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-muted/30 rounded-lg h-16 w-20" />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="absolute top-4 right-4 z-20"
    >
      <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-black/90 backdrop-blur-xl border-2 border-primary/30 shadow-[0_0_40px_rgba(0,231,255,0.4)]">
        {statItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.labelEn}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.03, duration: 0.3 }}
              className="relative group"
            >
              <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-black/80 to-black/60 backdrop-blur-sm border border-primary/20 px-2.5 py-2 hover:border-primary/60 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,231,255,0.5)]">
                <div className="flex flex-col items-center gap-1">
                  <Icon className={`w-4 h-4 bg-gradient-to-br ${item.color} bg-clip-text text-transparent`} />
                  <div className="text-[9px] text-muted-foreground/80 font-medium whitespace-nowrap leading-tight text-center">
                    {item.label}
                  </div>
                  <div className={`text-sm font-bold bg-gradient-to-br ${item.color} bg-clip-text text-transparent tabular-nums leading-tight`}>
                    <CounterAnimation 
                      value={item.value} 
                      decimals={item.decimals || 0}
                    />
                    {item.isCrypto && <span className="text-[8px] ml-0.5">tk</span>}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
