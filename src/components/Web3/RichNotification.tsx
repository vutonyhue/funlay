import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";

interface RichNotificationProps {
  show: boolean;
  amount: string;
  token: string;
  count: number;
  onClose: () => void;
  userId?: string;
}

export const RichNotification = ({ show, amount, token, count, onClose, userId }: RichNotificationProps) => {
  const [musicUrl, setMusicUrl] = useState<string | null>(null);

  // Fetch user's custom music URL
  useEffect(() => {
    const fetchMusicUrl = async () => {
      if (userId) {
        const { data } = await supabase
          .from("profiles")
          .select("music_url")
          .eq("id", userId)
          .single();
        
        if (data?.music_url) {
          setMusicUrl(data.music_url);
        }
      }
    };
    
    fetchMusicUrl();
  }, [userId]);

  useEffect(() => {
    if (show) {
      // Create continuous looping ringtone using Web Audio API
      let audioContext: AudioContext | null = null;
      let oscillator: OscillatorNode | null = null;
      let gainNode: GainNode | null = null;
      let ringtoneInterval: NodeJS.Timeout | null = null;
      
      // Play continuous ringtone pattern
      const playRingtone = () => {
        try {
          audioContext = new AudioContext();
          gainNode = audioContext.createGain();
          gainNode.connect(audioContext.destination);
          gainNode.gain.value = 0.3;
          
          // Create a pleasant notification sound pattern
          const playTone = (freq: number, duration: number, delay: number) => {
            if (!audioContext || !gainNode) return;
            
            const osc = audioContext.createOscillator();
            const oscGain = audioContext.createGain();
            
            osc.connect(oscGain);
            oscGain.connect(gainNode);
            
            osc.frequency.value = freq;
            osc.type = 'sine';
            
            const startTime = audioContext.currentTime + delay;
            oscGain.gain.setValueAtTime(0, startTime);
            oscGain.gain.linearRampToValueAtTime(0.5, startTime + 0.05);
            oscGain.gain.linearRampToValueAtTime(0, startTime + duration);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
          };
          
          // Play a cheerful money received melody pattern
          const playMelody = () => {
            playTone(880, 0.15, 0);    // A5
            playTone(1109, 0.15, 0.15); // C#6
            playTone(1319, 0.15, 0.3);  // E6
            playTone(1760, 0.3, 0.45);  // A6
            playTone(1319, 0.15, 0.8);  // E6
            playTone(1760, 0.4, 0.95);  // A6
          };
          
          // Play immediately
          playMelody();
          
          // Loop the ringtone continuously
          ringtoneInterval = setInterval(() => {
            playMelody();
          }, 1500);
          
        } catch (err) {
          console.error("Error playing ringtone:", err);
        }
      };
      
      playRingtone();
      
      // Play custom Suno music if available (on top of ringtone)
      let customAudio: HTMLAudioElement | null = null;
      if (musicUrl) {
        customAudio = new Audio(musicUrl);
        customAudio.volume = 0.5;
        customAudio.loop = true; // Loop the custom music
        customAudio.play().catch(err => console.error("Error playing music:", err));
      }

      // Play cute baby Aliens Angel voice saying "RICH RICH RICH"
      const speakNotification = () => {
        const voiceGender = localStorage.getItem("voiceGender") || "female";
        const voicePitch = localStorage.getItem("voicePitch") || "high";
        
        const utterance = new SpeechSynthesisUtterance("RICH RICH RICH");
        
        if (voicePitch === "high") {
          utterance.pitch = 2.0;
        } else if (voicePitch === "medium") {
          utterance.pitch = 1.5;
        } else {
          utterance.pitch = 1.0;
        }
        
        utterance.rate = 0.9;
        utterance.volume = 1;
        utterance.lang = 'en-US';
        
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice = voices.find(voice => 
            voiceGender === "female" 
              ? voice.name.toLowerCase().includes("female") || voice.name.toLowerCase().includes("samantha")
              : voice.name.toLowerCase().includes("male") || voice.name.toLowerCase().includes("alex")
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }
        
        window.speechSynthesis.speak(utterance);
      };
      
      // Speak voice notification repeatedly
      let voiceInterval: NodeJS.Timeout | null = null;
      
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speakNotification();
        };
      } else {
        speakNotification();
      }
      
      // Repeat voice every 3 seconds
      voiceInterval = setInterval(() => {
        speakNotification();
      }, 3000);

      // Trigger massive confetti celebration
      const duration = 10000; // Extended duration
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const confettiInterval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(confettiInterval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6347'],
        });

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#FFD700', '#FFA500', '#FFFF00', '#FF6347'],
        });

        confetti({
          ...defaults,
          particleCount: particleCount / 2,
          origin: { x: 0.5, y: 0.5 },
          colors: ['#FFFFFF', '#FFD700', '#00FF00'],
          shapes: ['star'],
        });
      }, 250);

      // Auto close after extended duration
      const timer = setTimeout(() => {
        clearInterval(confettiInterval);
        if (ringtoneInterval) clearInterval(ringtoneInterval);
        if (voiceInterval) clearInterval(voiceInterval);
        if (audioContext) {
          audioContext.close();
        }
        if (customAudio) {
          customAudio.pause();
          customAudio.currentTime = 0;
        }
        window.speechSynthesis.cancel();
        onClose();
      }, 10000);

      return () => {
        clearTimeout(timer);
        clearInterval(confettiInterval);
        if (ringtoneInterval) clearInterval(ringtoneInterval);
        if (voiceInterval) clearInterval(voiceInterval);
        if (audioContext) {
          audioContext.close();
        }
        if (customAudio) {
          customAudio.pause();
          customAudio.currentTime = 0;
        }
        window.speechSynthesis.cancel();
      };
    }
  }, [show, onClose, musicUrl]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            y: 0, 
            scale: 1,
          }}
          exit={{ opacity: 0, y: -50, scale: 0.5 }}
          className="fixed top-24 right-4 z-50 p-4 rounded-2xl shadow-2xl overflow-hidden flex items-center gap-3"
          style={{
            background: "white",
            border: "4px solid transparent",
            backgroundImage: "linear-gradient(white, white), linear-gradient(135deg, #FF0000, #FF7F00, #FFFF00, #00FF00, #00FFFF, #0000FF, #9400D3)",
            backgroundOrigin: "border-box",
            backgroundClip: "padding-box, border-box",
            boxShadow: "0 0 60px rgba(255, 0, 0, 0.7), 0 0 80px rgba(255, 127, 0, 0.6), 0 0 100px rgba(255, 255, 0, 0.5), 0 0 120px rgba(0, 255, 0, 0.4), 0 0 140px rgba(0, 0, 255, 0.3)",
          }}
        >
          {/* Pulsing Rainbow CAMLY Coin Icon */}
          <motion.img
            src="/images/camly-coin.png"
            alt="CAMLY COIN"
            className="w-12 h-12 rounded-full relative z-10"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 360],
              filter: [
                "drop-shadow(0 0 20px rgba(255, 0, 0, 0.8)) drop-shadow(0 0 40px rgba(255, 127, 0, 0.6))",
                "drop-shadow(0 0 20px rgba(255, 255, 0, 0.8)) drop-shadow(0 0 40px rgba(0, 255, 0, 0.6))",
                "drop-shadow(0 0 20px rgba(0, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(0, 0, 255, 0.6))",
                "drop-shadow(0 0 20px rgba(255, 0, 255, 0.8)) drop-shadow(0 0 40px rgba(255, 0, 0, 0.6))",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{
              boxShadow: "0 0 40px rgba(255, 215, 0, 1), 0 0 80px rgba(255, 165, 0, 0.8), 0 0 120px rgba(255, 255, 0, 0.6)",
            }}
          />
          
          <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 relative z-10">
            <motion.span
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="font-black text-3xl"
              style={{
                background: "linear-gradient(90deg, #FFD700 0%, #FFC300 30%, #FFB000 60%, #FF9500 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 900,
              }}
            >
              RICH
            </motion.span>
            <motion.span
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="font-black text-xl"
              style={{
                background: "linear-gradient(90deg, #FFD700 0%, #FFC300 30%, #FFB000 60%, #FF9500 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 900,
              }}
            >
              +{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} {token}
            </motion.span>
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-bold mt-1 relative z-10"
            style={{
              background: "linear-gradient(90deg, #FFD700 0%, #FFC300 30%, #FFB000 60%, #FF9500 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              fontWeight: 900,
            }}
          >
            💰 Chúc mừng! Bạn vừa nhận được tiền! 💎
          </motion.p>
          </div>
          
          {/* Golden Fireworks effects */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
            {[...Array(12)].map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const distance = 40 + Math.random() * 20;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                scale: [0, 1.5, 1, 0],
                x: [0, Math.cos(angle) * distance],
                y: [0, Math.sin(angle) * distance],
                background: [
                  "#FF0000", // Red
                  "#FF7F00", // Orange
                  "#FFFF00", // Yellow
                  "#00FF00", // Green
                  "#00FFFF", // Cyan
                  "#0000FF", // Blue
                  "#9400D3", // Violet
                  "#FF0000", // Back to Red
                ],
              }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.05,
                    ease: "easeOut",
                  }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                boxShadow: "0 0 20px currentColor, 0 0 40px currentColor",
              }}
                />
              );
            })}
            {/* Diamond sparkles */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`diamond-${i}`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.2, 0],
                  x: [0, Math.random() * 60 - 30],
                  y: [0, Math.random() * 60 - 30],
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeOut",
                }}
                className="absolute w-1.5 h-1.5"
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
