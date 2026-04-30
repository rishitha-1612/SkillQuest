import { motion, useScroll, useTransform } from 'framer-motion';

export function Cloud({
  initialX,
  initialY,
  scale = 1,
  opacity = 0.6,
  duration = 20,
  distance = 100,
  zIndex = 10,
}) {
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 1000], [0, -distance * 2]);

  return (
    <motion.div
      style={{
        left: initialX,
        top: initialY,
        scale,
        opacity,
        y: yParallax,
        zIndex,
      }}
      initial={{ x: -10 }}
      animate={{
        x: ['-10vw', '110vw'],
      }}
      transition={{
        duration: duration * 2.5,
        repeat: Infinity,
        ease: 'linear',
        delay: -Math.random() * duration,
      }}
      className="absolute"
    >
      <div className="relative">
        <div className="w-64 h-32 bg-white rounded-full cloud-blur" />
        <div className="w-40 h-40 bg-white rounded-full absolute -top-16 left-12 cloud-blur" />
        <div className="w-32 h-32 bg-white rounded-full absolute -top-8 -left-8 cloud-blur" />
      </div>
    </motion.div>
  );
}
