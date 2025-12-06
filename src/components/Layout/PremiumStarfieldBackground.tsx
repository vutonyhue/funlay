import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export const PremiumStarfieldBackground = () => {
  const [stars, setStars] = useState<Star[]>([]);

  useEffect(() => {
    // Generate random stars
    const generatedStars: Star[] = Array.from({ length: 80 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.3,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
    }));
    setStars(generatedStars);
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {/* Soft blue-purple gradient background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 60%),
            linear-gradient(135deg, 
              hsl(240, 20%, 8%) 0%, 
              hsl(260, 30%, 10%) 25%, 
              hsl(250, 25%, 9%) 50%, 
              hsl(270, 30%, 10%) 75%, 
              hsl(240, 20%, 8%) 100%
            )
          `,
        }}
      />

      {/* Animated gradient overlay */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            'radial-gradient(ellipse at 30% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 70% 70%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 30% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 70% 30%, rgba(139, 92, 246, 0.1) 0%, transparent 50%)',
            'radial-gradient(ellipse at 30% 30%, rgba(99, 102, 241, 0.1) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Slow moving starfield */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [star.opacity * 0.3, star.opacity, star.opacity * 0.3],
            scale: [0.8, 1.2, 0.8],
            y: [0, -30, 0],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Larger twinkling stars */}
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div
          key={`twinkle-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 5,
            repeat: Infinity,
          }}
        >
          <div 
            className="w-1 h-1 bg-white rounded-full"
            style={{
              boxShadow: '0 0 6px 2px rgba(255,255,255,0.6)',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};
