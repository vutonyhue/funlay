import { motion } from "framer-motion";
import { useMemo } from "react";

export const LightParticles = () => {
  // Floating particles going upward
  const particles = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 12 + Math.random() * 15,
      size: 2 + Math.random() * 4,
      opacity: 0.4 + Math.random() * 0.5,
    }));
  }, []);

  // Twinkling stars
  const stars = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 3,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 3,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Soft white background with golden glow */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(250, 204, 21, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(250, 204, 21, 0.1) 0%, transparent 40%),
            radial-gradient(ellipse at 20% 80%, rgba(250, 204, 21, 0.08) 0%, transparent 40%),
            linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(255, 251, 235, 1) 50%, rgba(255, 255, 255, 1) 100%)
          `,
        }}
      />

      {/* Twinkling stars */}
      {stars.map((star) => (
        <motion.div
          key={`star-${star.id}`}
          className="absolute rounded-full"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
            background: `radial-gradient(circle, rgba(250, 204, 21, 0.9) 0%, rgba(250, 204, 21, 0.4) 50%, transparent 100%)`,
            boxShadow: `0 0 ${star.size * 3}px rgba(250, 204, 21, 0.6)`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Floating particles going UPWARD */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, rgba(250, 204, 21, ${particle.opacity}) 0%, rgba(255, 215, 0, ${particle.opacity * 0.5}) 50%, transparent 100%)`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(250, 204, 21, ${particle.opacity})`,
          }}
          initial={{ y: "110vh", opacity: 0 }}
          animate={{
            y: "-10%",
            opacity: [0, particle.opacity, particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}

      {/* Subtle golden aurora glow */}
      <motion.div 
        className="absolute inset-0"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `
            radial-gradient(ellipse at 30% 30%, rgba(250, 204, 21, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 70%, rgba(255, 215, 0, 0.06) 0%, transparent 50%)
          `,
        }}
      />
    </div>
  );
};
