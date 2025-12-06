import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, Eye, MessageSquare, Coins, Sparkles } from "lucide-react";
import { CounterAnimation } from "@/components/Layout/CounterAnimation";
import { motion } from "framer-motion";

interface GlassmorphismStatsProps {
  userId: string;
  channelId: string;
}

interface ChannelStats {
  followers: number;
  videos: number;
  totalViews: number;
  comments: number;
  rewardsEarned: number;
}

export const GlassmorphismStats = ({ userId, channelId }: GlassmorphismStatsProps) => {
  const [stats, setStats] = useState<ChannelStats>({
    followers: 0,
    videos: 0,
    totalViews: 0,
    comments: 0,
    rewardsEarned: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      // Fetch channel for subscriber count
      const { data: channelData } = await supabase
        .from("channels")
        .select("subscriber_count")
        .eq("id", channelId)
        .single();

      // Fetch videos count and total views
      const { data: videosData } = await supabase
        .from("videos")
        .select("id, view_count")
        .eq("channel_id", channelId)
        .eq("is_public", true);

      const videoIds = videosData?.map(v => v.id) || [];
      const totalViews = videosData?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0;

      // Fetch comments on user's videos
      let totalComments = 0;
      if (videoIds.length > 0) {
        const { count } = await supabase
          .from("comments")
          .select("id", { count: 'exact', head: true })
          .in("video_id", videoIds);
        totalComments = count || 0;
      }

      // Fetch total rewards from profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("total_camly_rewards")
        .eq("id", userId)
        .single();

      setStats({
        followers: channelData?.subscriber_count || 0,
        videos: videosData?.length || 0,
        totalViews,
        comments: totalComments,
        rewardsEarned: profileData?.total_camly_rewards || 0,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error fetching channel stats:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [userId, channelId]);

  // Real-time updates
  useEffect(() => {
    const channelSub = supabase
      .channel(`stats-updates-${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'channels', filter: `id=eq.${channelId}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'videos', filter: `channel_id=eq.${channelId}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(channelSub);
    };
  }, [userId, channelId]);

  const statItems = [
    {
      icon: Users,
      label: "Followers",
      value: stats.followers,
      gradient: "from-pink-500 via-rose-500 to-red-500",
      glowColor: "rgba(236,72,153,0.5)",
    },
    {
      icon: Video,
      label: "Videos",
      value: stats.videos,
      gradient: "from-violet-500 via-purple-500 to-indigo-500",
      glowColor: "rgba(139,92,246,0.5)",
    },
    {
      icon: Eye,
      label: "Total Views",
      value: stats.totalViews,
      gradient: "from-cyan-500 via-teal-500 to-emerald-500",
      glowColor: "rgba(6,182,212,0.5)",
    },
    {
      icon: MessageSquare,
      label: "Comments",
      value: stats.comments,
      gradient: "from-orange-500 via-amber-500 to-yellow-500",
      glowColor: "rgba(245,158,11,0.5)",
    },
    {
      icon: Coins,
      label: "Rewards Earned",
      value: stats.rewardsEarned,
      gradient: "from-yellow-400 via-amber-400 to-orange-400",
      glowColor: "rgba(251,191,36,0.6)",
      suffix: " CAMLY",
      decimals: 0,
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse h-28 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {statItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08, duration: 0.4, type: "spring" }}
            whileHover={{ scale: 1.03, y: -4 }}
            className="relative group"
          >
            {/* Glassmorphism card */}
            <div 
              className="relative overflow-hidden rounded-2xl p-4 h-28 flex flex-col justify-between"
              style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: `
                  0 8px 32px rgba(0,0,0,0.2),
                  inset 0 1px 0 rgba(255,255,255,0.1),
                  inset 0 -1px 0 rgba(0,0,0,0.1)
                `,
              }}
            >
              {/* Hover glow effect */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${item.glowColor}, transparent 70%)`,
                }}
              />

              {/* Floating sparkles on hover */}
              <motion.div
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-white/40" />
              </motion.div>

              {/* Icon with gradient background */}
              <div className="flex items-center gap-2">
                <div 
                  className={`p-2 rounded-xl bg-gradient-to-br ${item.gradient}`}
                  style={{
                    boxShadow: `0 4px 15px ${item.glowColor}`,
                  }}
                >
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs text-white/60 font-medium truncate">
                  {item.label}
                </span>
              </div>

              {/* Value with animated gradient */}
              <motion.div
                className="text-2xl font-black tracking-tight"
                style={{
                  background: `linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.8) 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                }}
              >
                <CounterAnimation value={item.value} decimals={item.decimals || 0} />
                {item.suffix && <span className="text-sm font-semibold ml-1">{item.suffix}</span>}
              </motion.div>

              {/* Bottom gradient line */}
              <div 
                className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${item.gradient} opacity-50 group-hover:opacity-100 transition-opacity`}
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
