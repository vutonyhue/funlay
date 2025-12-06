import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RainbowBreathingCardProps {
  children: ReactNode;
  className?: string;
}

export const RainbowBreathingCard = ({ children, className = "" }: RainbowBreathingCardProps) => {
  return (
    <motion.div
      className={`relative ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Rainbow breathing border */}
      <motion.div
        className="absolute -inset-[2px] rounded-2xl opacity-60"
        style={{
          background: `linear-gradient(
            90deg,
            #ff0080,
            #ff8c00,
            #ffd700,
            #00ff00,
            #00e7ff,
            #7a2bff,
            #ff00e5,
            #ff0080
          )`,
          backgroundSize: '400% 100%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          backgroundPosition: {
            duration: 8,
            repeat: Infinity,
            ease: "linear",
          },
          opacity: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
      />
      
      {/* Inner content */}
      <div className="relative rounded-2xl overflow-hidden">
        {children}
      </div>
    </motion.div>
  );
};
