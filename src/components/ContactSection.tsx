import { useState, useEffect, useRef } from 'react';
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Github, Linkedin, Mail } from 'lucide-react';

const quotes = [
  "Empowering web development with the intelligence of AI.",
  "Building smarter, faster, and more efficient applications with AI tools.",
  "Leveraging AI to accelerate innovation and code with confidence.",
  "Combining creativity with artificial intelligence for next-gen web experiences.",
  "Supercharging development workflows with cutting-edge AI technology.",
  "Where human logic meets machine intelligence in modern development.",
  "Shaping the future of code with AI-assisted solutions.",
  "Harnessing the power of AI to write, debug, and optimize code smarter.",
  "From idea to deployment—AI accelerates every step of the dev journey.",
  "Transforming traditional development with the future of AI assistance."
];

const ContactSection = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const sectionRef = useRef(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: false, amount: 0.3 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [100, 0, 0, 100]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const animations = {
    container: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
          when: "beforeChildren"
        }
      }
    },
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6 }
      }
    },
    quote: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -20 },
      transition: { duration: 0.8 }
    }
  };

  const ContactInfoItem = ({ icon: Icon, title, value, href }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
    href?: string;
  }) => (
    <motion.div
      className="flex items-start gap-4 sm:gap-6"
      variants={animations.item}
    >
      <div className="flex items-center justify-center bg-primary/20 p-3 sm:p-4 rounded-full shadow-glow shrink-0">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
      </div>
      <div>
        <h4 className="font-medium text-base sm:text-lg mb-1">{title}</h4>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${title} link`}
            className="text-foreground/70 hover:text-primary transition-colors text-sm sm:text-base break-all"
          >
            {value}
          </a>
        ) : (
          <span className="text-foreground/70 text-sm sm:text-base break-all">{value}</span>
        )}
      </div>
    </motion.div>
  );

  return (
    <section id="contact" ref={sectionRef} className="py-16 sm:py-24 md:py-32 px-4 sm:px-6 relative overflow-hidden">
      <div className="absolute inset-0 animated-gradient opacity-10 -z-10" />

      <motion.div
        className="container mx-auto max-w-7xl"
        style={{ opacity, y }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">CONTACT ME</h2>
          <motion.div
            className="w-32 sm:w-40 h-1 bg-primary mx-auto mt-4 sm:mt-6 opacity-60 shadow-glow"
            animate={{ width: ["0%", "25%", "10%", "25%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.div>

        <motion.div
          ref={containerRef}
          variants={animations.container}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 max-w-6xl mx-auto"
        >
          {/* Contact Info */}
          <motion.div
            className="space-y-6 sm:space-y-8 bg-gradient-to-br from-background to-muted/50 p-6 sm:p-8 rounded-xl border border-white/10 shadow-glow"
            variants={animations.item}
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-4 gradient-text">Get In Touch</h3>

            <ContactInfoItem
              icon={Mail}
              title="Email"
              value="sahiltalaviya9922@gmail.com"
              href="mailto:sahiltalaviya9922@gmail.com"
            />

            <ContactInfoItem
              icon={Linkedin}
              title="LinkedIn"
              value="linkedin.com/in/sahil-talaviya-99o9657o18"
              href="https://linkedin.com/in/sahil-talaviya-99o9657o18"
            />

            <ContactInfoItem
              icon={Github}
              title="GitHub"
              value="github.com/sahiltalaviya99"
              href="https://github.com/sahiltalaviya99"
            />
          </motion.div>

          {/* Quote Section */}
          <motion.div className="h-full flex flex-col" variants={animations.item}>
            <div className="relative h-full bg-gradient-to-br from-background to-muted/50 p-6 sm:p-8 rounded-xl border border-white/10 shadow-glow">
              <div className="absolute -inset-1 bg-gradient-to-r  rounded-xl blur opacity-30 -z-10" />
              <div className="h-full flex flex-col justify-center">
                <h3 className="text-xl sm:text-2xl font-bold mb-6 gradient-text">My Philosophy</h3>
                <div className="min-h-[9rem] sm:min-h-[10rem] md:min-h-[11rem] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentQuote}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={animations.quote}
                      className="text-foreground/80 text-lg sm:text-xl md:text-2xl leading-relaxed"
                    >
                      {quotes[currentQuote]}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <p className="mt-4 text-right text-sm sm:text-base text-foreground/60">— Sahil Talaviya</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default ContactSection;
