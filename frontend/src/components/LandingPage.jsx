import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

import '../landing.css';
import { Cloud } from './Cloud';
import { Globe } from './Globe';
import { ScrollReveal } from './ScrollReveal';

export default function LandingPage({ onLogin, onSignup }) {
  const { scrollYProgress } = useScroll();
  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 45,
    damping: 18,
    mass: 0.6,
  });
  const backgroundY = useTransform(smoothScroll, [0, 1], ['0%', '14%']);

  return (
    <main className="relative min-h-screen overflow-hidden selection:bg-brand-lime selection:text-brand-green">
      <div className="fixed top-6 right-6 md:top-8 md:right-10 z-40">
        <div className="flex items-baseline justify-center gap-2 md:gap-2.5 font-display text-xl md:text-3xl">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="text-white cinematic-glow"
            onClick={onLogin}
          >
            LOGIN
          </motion.button>

          <span className="font-serif-header text-xs md:text-lg text-brand-green cinematic-glow mx-1 self-center brightness-110">
            OR
          </span>

          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="text-white cinematic-glow"
            onClick={onSignup}
          >
            SIGNUP
          </motion.button>
        </div>
      </div>

      <motion.div style={{ y: backgroundY }} className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <Cloud initialX="10%" initialY="15%" scale={0.8} opacity={0.4} duration={36} distance={120} />
        <Cloud initialX="70%" initialY="25%" scale={1.2} opacity={0.5} duration={30} distance={90} />
        <Cloud initialX="40%" initialY="60%" scale={0.9} opacity={0.3} duration={42} distance={140} />
        <Cloud initialX="80%" initialY="75%" scale={1.1} opacity={0.4} duration={34} distance={100} />
        <Cloud initialX="5%" initialY="85%" scale={1.3} opacity={0.3} duration={46} distance={130} />
        <Cloud initialX="25%" initialY="40%" scale={1.5} opacity={0.2} duration={52} distance={180} />
        <Cloud initialX="90%" initialY="10%" scale={0.7} opacity={0.3} duration={28} distance={70} />
        <Cloud initialX="50%" initialY="90%" scale={1.0} opacity={0.2} duration={58} distance={220} />
      </motion.div>

      <section className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-20 pb-40 px-6">
        <header className="text-center mb-12 px-4">
          <h1 className="font-display text-6xl md:text-8xl tracking-widest drop-shadow-lg mb-2">
            <span className="text-brand-lime">Skill</span>
            <span className="text-white cinematic-glow">Quest</span>
          </h1>
          <p className="font-serif-header text-lg md:text-xl text-white/90 italic tracking-wide max-w-xl mx-auto opacity-90 drop-shadow-sm">
            Master real skills through cinematic simulation.
          </p>
        </header>

        <div className="mb-12 origin-center">
          <Globe />
        </div>
      </section>

      <div>
        <section className="relative z-10 max-w-6xl mx-auto py-28 px-8 md:px-12 min-h-[70vh]">
          <ScrollReveal direction="up">
            <div className="relative min-h-[28rem]">
              <div className="md:absolute md:left-8 md:top-2">
                <h2 className="font-display text-5xl md:text-7xl text-white cinematic-glow italic opacity-90 text-left">
                  About Us
                </h2>
              </div>

              <div className="mt-16 md:mt-0 md:absolute md:right-8 md:top-28 max-w-2xl">
                <div className="space-y-6 text-xl text-white/90 leading-relaxed font-body italic text-left">
                  <p>
                    SkillQuest isn&apos;t just about learning - it&apos;s about taking control of what you don&apos;t
                    know. Every concept is a territory, every problem is a challenge, and every solution is a step
                    toward conquering your own map of knowledge.
                  </p>
                  <p>There are no shortcuts, no predefined paths - only curiosity, persistence, and progress.</p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>

        <section className="relative z-10 flex flex-col items-center justify-center py-48 px-8 text-center bg-white/5 backdrop-blur-sm">
          <ScrollReveal>
            <div className="max-w-3xl">
              <p className="font-accent text-2xl md:text-3xl text-white italic leading-relaxed opacity-80">
                This is where learning stops feeling like a task and starts feeling like a journey. Explore freely,
                think deeply, and claim every idea as your own - because in SkillQuest, you don&apos;t just study the
                world... <span className="text-white cinematic-glow opacity-100">you conquer it.</span>
              </p>
            </div>
          </ScrollReveal>
        </section>

        <section className="relative z-10 min-h-[80vh] flex flex-col items-center justify-center pb-60 px-8">
          <ScrollReveal direction="up">
            <div className="text-center">
              <h3 className="font-accent text-3xl md:text-4xl text-white/90 mb-12 italic tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]">
                Experience the Magic
              </h3>

              <div className="flex items-baseline justify-center gap-2 md:gap-4 font-display text-5xl md:text-8xl">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-white cinematic-glow"
                  onClick={onLogin}
                >
                  LOGIN
                </motion.button>

                <span className="font-serif-header text-xl md:text-3xl text-brand-green cinematic-glow mx-1 self-center brightness-110">
                  OR
                </span>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-white cinematic-glow"
                  onClick={onSignup}
                >
                  SIGNUP
                </motion.button>
              </div>
            </div>
          </ScrollReveal>

          <div className="absolute bottom-0 w-full overflow-hidden h-40 pointer-events-none">
            <div className="w-[150%] h-full bg-white/20 blur-[100px] absolute -bottom-20 left-[-25%] rounded-t-full" />
          </div>
        </section>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 text-white/40 font-serif-header italic text-sm tracking-widest hidden md:block"
        >
          Scroll to Begin
        </motion.div>
      </div>
    </main>
  );
}
