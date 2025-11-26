import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RichNotificationProps {
  show: boolean;
  amount: string;
  token: string;
  count: number;
  onClose: () => void;
}

export const RichNotification = ({ show, amount, token, count, onClose }: RichNotificationProps) => {
  useEffect(() => {
    if (show) {
      // Play angel voice notification
      const speakNotification = () => {
        const utterance = new SpeechSynthesisUtterance("Chúc mừng bạn nhận được tiền!");
        utterance.pitch = 2; // High pitch for angel/baby voice
        utterance.rate = 0.9;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      };
      speakNotification();

      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          className="fixed top-24 right-4 z-50 glass-card p-6 rounded-2xl shadow-2xl border-2 border-golden/30"
          style={{
            background: "rgba(10, 14, 44, 0.95)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex items-center gap-3">
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                textShadow: [
                  "0 0 10px #FFD700",
                  "0 0 30px #FFD700, 0 0 50px #FFD700",
                  "0 0 10px #FFD700",
                ],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-[#FFD700] font-black text-4xl"
              style={{
                textShadow: "0 0 20px #FFD700, 0 0 40px #FFD700",
              }}
            >
              Rich
            </motion.span>
            <motion.span
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-[#FFD700] font-bold text-3xl"
              style={{
                textShadow: "0 0 10px #FFD700, 0 0 20px #FFD700, 0 0 30px #FFFF00",
              }}
            >
              +{amount} {token}
            </motion.span>
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
                textShadow: [
                  "0 0 10px #00FF00",
                  "0 0 30px #00FF00, 0 0 50px #7FFF00",
                  "0 0 10px #00FF00",
                ],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-[#00FF00] font-black text-2xl ml-3"
              style={{
                textShadow: "0 0 20px #00FF00, 0 0 40px #7FFF00",
              }}
            >
              #{count}
            </motion.span>
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-golden mt-2"
          >
            💰 Bạn vừa nhận được tiền!
          </motion.p>
          
          {/* Golden Fireworks effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(20)].map((_, i) => {
              const angle = (i / 20) * Math.PI * 2;
              const distance = 80 + Math.random() * 40;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    scale: [0, 1.5, 1, 0],
                    x: [0, Math.cos(angle) * distance],
                    y: [0, Math.sin(angle) * distance],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeOut",
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    background: `linear-gradient(135deg, #FFD700, #FFA500, #FFFF00)`,
                    boxShadow: "0 0 15px #FFD700, 0 0 30px #FFA500",
                  }}
                />
              );
            })}
            {/* Diamond sparkles */}
            {[...Array(15)].map((_, i) => (
              <motion.div
                key={`diamond-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: [0, Math.random() * 120 - 60],
                  y: [0, Math.random() * 120 - 60],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
                className="absolute w-2 h-2"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: '#FFFFFF',
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  boxShadow: "0 0 10px #FFD700, 0 0 20px #FFFFFF",
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
