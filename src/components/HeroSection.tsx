import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import ThreeBackground from './ThreeBackground';

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkMobile);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100
      }
    }
  };

  return (
    <section
      id="home"
      className="relative h-[90vh] sm:min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-0 sm:pb-0"
    >
      <ThreeBackground />

      {/* Background glow effects */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: Math.max(0, Math.min(1, 1 - scrollY / (isMobile ? 500 : 900))),
          transform: `translateY(${scrollY * (isMobile ? 0.2 : 0.4)}px)`,
        }}
      >
        <div className="absolute left-4 sm:left-10 md:left-20 top-1/4 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 rounded-full bg-primary/20 filter blur-xl sm:blur-2xl md:blur-3xl" />
        <div className="absolute right-4 sm:right-10 md:right-20 bottom-1/3 w-48 sm:w-64 md:w-96 h-48 sm:h-64 md:h-96 rounded-full bg-accent/20 filter blur-xl sm:blur-2xl md:blur-3xl" />
      </motion.div>

      {/* Main content container */}
      <motion.div
        className="max-w-4xl mx-auto z-10 text-center px-2 sm:px-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="mb-2 sm:mb-4 text-sm sm:text-base md:text-lg text-accent font-medium tracking-wider"
        >
          HELLO, I'M
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-4 sm:mb-6 tracking-tight"
        >
          <motion.span
            className="block glow-text mb-1 sm:mb-2"
            animate={{ opacity: [0.7, 1, 0.7], y: [0, -3, 0] }}
            transition={{ duration: 5, repeat: Infinity, repeatType: "reverse" }}
          >
            Sahil Talaviya
          </motion.span>
          <motion.span
            className="gradient-text text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            style={{
              backgroundSize: "200% auto",
              display: "inline-block",
              lineHeight: "1.2"
            }}
          >
            Web Developer & Automation Expert
          </motion.span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-base sm:text-lg md:text-xl text-foreground/80 max-w-xs sm:max-w-md md:max-w-2xl mx-auto mb-6 sm:mb-8 md:mb-10"
        >
          I build responsive, performant web applications using React.js, Next.js,
JavaScript, and modern frontend technologies, along with workflow automation using n8n.

        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 justify-center"
        >
          <a
            href="#projects"
            className="btn-cinematic group px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base"
          >
            <span className="mr-1 sm:mr-2">View My Work</span>
            <span className="group-hover:translate-x-1 inline-block transition-transform">→</span>
          </a>
          <a
            href="#contact"
            className="glass-effect text-white px-4 py-2 sm:px-5 sm:py-3 text-sm sm:text-base rounded-lg font-medium border border-white/10 
                     hover:border-white/30 transition-all duration-300 hover:shadow-glow"
          >
            Contact Me
          </a>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.a
        href="#about"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="hidden xs:flex absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 flex-col items-center text-foreground/50 
                 hover:text-primary transition-all duration-300 hover:scale-110"
      >
        <span className="text-xs sm:text-sm mb-1 sm:mb-2">Scroll Down</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
        >
          <ArrowDown className="h-4 w-4 sm:h-5 sm:w-5" />
        </motion.div>
      </motion.a>
    </section>
  );
};

export default HeroSection;
