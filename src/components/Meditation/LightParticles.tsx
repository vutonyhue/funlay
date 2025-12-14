import { motion } from "framer-motion";
import { useMemo } from "react";

export const LightParticles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 15 + Math.random() * 20,
      size: 2 + Math.random() * 4,
      opacity: 0.3 + Math.random() * 0.5,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            background: `radial-gradient(circle, rgba(0, 231, 255, ${particle.opacity}) 0%, rgba(168, 85, 247, ${particle.opacity * 0.5}) 50%, transparent 100%)`,
            boxShadow: `0 0 ${particle.size * 2}px rgba(0, 231, 255, ${particle.opacity})`,
          }}
          initial={{ y: "-10%", opacity: 0 }}
          animate={{
            y: "110vh",
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

      {/* Subtle Aurora Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-purple-500/3 to-amber-500/5 animate-pulse" style={{ animationDuration: '8s' }} />
    </div>
  );
};
