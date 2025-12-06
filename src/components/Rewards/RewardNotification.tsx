import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Sparkles, Star } from "lucide-react";
import confetti from "canvas-confetti";

interface RewardNotificationProps {
  amount: number;
  type: "VIEW" | "LIKE" | "COMMENT" | "SHARE" | "UPLOAD" | "REFERRAL";
  show: boolean;
  onClose: () => void;
}

const REWARD_LABELS = {
  VIEW: "Xem video",
  LIKE: "Thích video",
  COMMENT: "Bình luận",
  SHARE: "Chia sẻ",
  UPLOAD: "Đăng video",
  REFERRAL: "Giới thiệu bạn bè",
};

const playChaChingSound = () => {
  // Create audio context for cha-ching sound
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // First coin sound
  const playNote = (frequency: number, startTime: number, duration: number) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };
  
  const now = audioContext.currentTime;
  // Cha-ching melody
  playNote(1318.5, now, 0.1); // E6
  playNote(1568, now + 0.08, 0.1); // G6
  playNote(2093, now + 0.16, 0.15); // C7
  playNote(2637, now + 0.28, 0.2); // E7
};

const triggerCelebrationConfetti = () => {
  // Burst from bottom center
  confetti({
    particleCount: 80,
    spread: 100,
    origin: { y: 0.9, x: 0.5 },
    colors: ['#FFD700', '#FFA500', '#00E7FF', '#7A2BFF', '#FF00E5'],
    startVelocity: 45,
    gravity: 0.8,
    ticks: 100,
    zIndex: 9999,
  });
  
  // Side bursts
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.8 },
      colors: ['#FFD700', '#FFA500', '#00E7FF'],
      zIndex: 9999,
    });
    confetti({
      particleCount: 40,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.8 },
      colors: ['#FFD700', '#FFA500', '#00E7FF'],
      zIndex: 9999,
    });
  }, 100);
};

export const RewardNotification = ({ amount, type, show, onClose }: RewardNotificationProps) => {
  useEffect(() => {
    if (show) {
      // Play cha-ching sound
      playChaChingSound();
      
      // Trigger confetti celebration
      triggerCelebrationConfetti();

      // Auto close after 4 seconds
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  const formattedAmount = amount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: {
              type: "spring",
              damping: 12,
              stiffness: 200,
            }
          }}
          exit={{ 
            opacity: 0, 
            y: -50, 
            scale: 0.8,
            transition: { duration: 0.3 }
          }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          {/* Floating particles */}
          <div className="absolute inset-0 overflow-visible">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 0, x: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  y: [-20, -80],
                  x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 10)],
                }}
                transition={{
                  duration: 1.5,
                  delay: i * 0.1,
                  repeat: Infinity,
                  repeatDelay: 0.5,
                }}
                className="absolute left-1/2 top-0"
              >
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              </motion.div>
            ))}
          </div>

          {/* Main notification card */}
          <motion.div
            animate={{
              boxShadow: [
                "0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,165,0,0.3)",
                "0 0 30px rgba(255,215,0,0.6), 0 0 60px rgba(255,165,0,0.4)",
                "0 0 20px rgba(255,215,0,0.4), 0 0 40px rgba(255,165,0,0.3)",
              ],
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="relative bg-gradient-to-br from-[#2a2a2a] via-[#3a3a3a] to-[#2a2a2a] rounded-2xl p-5 min-w-[320px] border-2 border-yellow-500/60"
          >
            {/* Rainbow glow border */}
            <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-[#00E7FF] via-[#7A2BFF] via-[#FF00E5] to-[#FFD700] opacity-60 blur-sm -z-10 animate-pulse" />
            
            {/* Content */}
            <div className="flex items-center gap-4">
              {/* Animated coin icon */}
              <motion.div
                animate={{ 
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="relative"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/50">
                  <Coins className="w-8 h-8 text-yellow-900" />
                </div>
                <motion.div
                  animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute inset-0 rounded-full bg-yellow-400/30"
                />
                <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 animate-spin" />
              </motion.div>

              {/* Text content */}
              <div className="flex-1">
                <div className="text-xs text-gray-400 mb-1 uppercase tracking-wide">
                  {REWARD_LABELS[type]}
                </div>
                <div className="flex items-baseline gap-2">
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 8 }}
                    className="text-3xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-orange-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                  >
                    +{formattedAmount}
                  </motion.span>
                  <span className="text-lg font-bold text-yellow-500">CAMLY</span>
                </div>
              </div>
            </div>

            {/* Bottom sparkle bar */}
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-3 h-1 rounded-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
