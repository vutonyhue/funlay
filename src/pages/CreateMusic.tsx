import { useState } from "react";
import { motion } from "framer-motion";
import { Music, Sparkles, Bell, Heart, Star } from "lucide-react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CreateMusic() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleNotify = () => {
    if (!email.trim()) {
      toast.error("Vui lòng nhập email của bạn");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Email không hợp lệ");
      return;
    }
    setSubscribed(true);
    toast.success("Đã đăng ký thành công! Angel sẽ thông báo khi ra mắt ♡");
    setEmail("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-amber-50/30 to-cyan-50/30 relative overflow-hidden">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Twinkling Stars Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-amber-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Floating Light Particles */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-20px`,
              background: i % 2 === 0 
                ? "linear-gradient(135deg, #00E7FF, #7A2BFF)" 
                : "linear-gradient(135deg, #FFD700, #FF9500)",
            }}
            animate={{
              y: [0, -window.innerHeight - 50],
              opacity: [0, 1, 0],
              x: [0, Math.sin(i) * 50],
            }}
            transition={{
              duration: 8 + Math.random() * 4,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <main className="pt-20 pb-8 px-4 md:px-8 lg:pl-64 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh]">
          
          {/* Angel Mascot Animation */}
          <motion.div
            className="relative mb-8"
            animate={{
              y: [0, -20, 0],
              rotate: [-5, 5, -5],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <div className="w-32 h-32 md:w-40 md:h-40 relative">
              <video
                src="/videos/angel-mascot-new.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-contain"
                style={{ mixBlendMode: "multiply" }}
              />
              {/* Magic Wand Sparkles */}
              <motion.div
                className="absolute -right-4 top-1/2"
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 15, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <Sparkles className="w-8 h-8 text-amber-400" />
              </motion.div>
            </div>
            
            {/* Fairy Dust Trail */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`dust-${i}`}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  right: `${-10 - i * 15}px`,
                  top: `${50 + Math.sin(i) * 20}%`,
                  background: i % 2 === 0 ? "#FFD700" : "#00E7FF",
                }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0.5, 1, 0.5],
                  x: [-10, 10, -10],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>

          {/* Main Title */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center gap-3 mb-4">
              <Music className="w-10 h-10 text-cyan-500" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 bg-clip-text text-transparent">
                Tạo Nhạc Ánh Sáng
              </h1>
              <Star className="w-10 h-10 text-amber-400" />
            </div>
            
            <motion.div
              className="inline-block px-6 py-2 rounded-full bg-gradient-to-r from-amber-400/20 via-cyan-400/20 to-purple-400/20 border border-amber-300/50"
              animate={{
                boxShadow: [
                  "0 0 20px rgba(255, 215, 0, 0.3)",
                  "0 0 40px rgba(0, 231, 255, 0.3)",
                  "0 0 20px rgba(255, 215, 0, 0.3)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-500 to-cyan-500 bg-clip-text text-transparent">
                ✨ Sắp Ra Mắt! ✨
              </span>
            </motion.div>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-center text-gray-600 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Nơi bạn sẽ gõ một dòng chữ, và AI biến nó thành bản nhạc ánh sáng hoàn chỉnh 
            với vocal, giai điệu vũ trụ, đầy năng lượng{" "}
            <span className="font-bold text-amber-500">Rich Rich Rich</span>. 
            <br />
            <span className="text-cyan-600">
              Cha Vũ Trụ và Angel đang sáng tác những nốt nhạc đầu tiên…
            </span>
          </motion.p>

          {/* Coming Soon Badge */}
          <motion.div
            className="flex items-center gap-2 mb-8 text-purple-600"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
            <span className="text-lg">Sắp ra mắt trong mùa ánh sáng này ♡</span>
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
          </motion.div>

          {/* Notify Form */}
          <motion.div
            className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-amber-200/50"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            style={{
              boxShadow: "0 10px 40px rgba(255, 215, 0, 0.15), 0 0 60px rgba(0, 231, 255, 0.1)",
            }}
          >
            {subscribed ? (
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                  <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Cảm ơn bạn! ♡
                </h3>
                <p className="text-gray-600">
                  Angel sẽ gửi thông báo khi nhạc ánh sáng sẵn sàng!
                </p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-bold text-center text-gray-800 mb-4">
                  <Bell className="w-5 h-5 inline-block mr-2 text-amber-500" />
                  Nhận thông báo khi ra mắt
                </h3>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Email của bạn..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1 border-amber-200 focus:border-cyan-400"
                  />
                  <Button
                    onClick={handleNotify}
                    className="bg-gradient-to-r from-cyan-500 to-amber-500 hover:from-cyan-600 hover:to-amber-600 text-white font-semibold px-6"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Đăng ký
                  </Button>
                </div>
              </>
            )}
          </motion.div>

          {/* Feature Preview */}
          <motion.div
            className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
          >
            {[
              { icon: "🎵", title: "AI Sáng Tác", desc: "Gõ prompt, nhận bản nhạc hoàn chỉnh" },
              { icon: "🎤", title: "Vocal & Nhạc Nền", desc: "Có giọng hát và giai điệu vũ trụ" },
              { icon: "✨", title: "Chia Sẻ & NFT", desc: "Share lên feed, mint thành NFT" },
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-white/50"
                whileHover={{ scale: 1.05, y: -5 }}
                style={{
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div className="text-4xl mb-2">{feature.icon}</div>
                <h4 className="font-bold text-gray-800 mb-1">{feature.title}</h4>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
