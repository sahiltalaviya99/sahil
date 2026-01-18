import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

const AboutSection = () => {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Smooth scroll-based animation
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [30, 0, 0, -30]);
  const textTranslateX = useTransform(scrollYProgress, [0, 0.5], [-30, 0]);

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 },
  };

  const scaleIn = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative py-16 md:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden flex items-center min-h-screen"
    >
      {/* Background Blur Blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-0 top-1/4 w-64 h-64 md:w-96 md:h-96 bg-primary/10 rounded-full blur-xl md:blur-3xl" />
        <div className="absolute right-0 bottom-1/4 w-48 h-48 md:w-64 md:h-64 bg-accent/10 rounded-full blur-xl md:blur-3xl" />
      </div>

      <motion.article
        className="container mx-auto max-w-6xl w-full px-4 sm:px-6"
        style={{ opacity, y }}
      >
        <motion.header
          variants={fadeInUp}
          initial="hidden"
          whileInView="visible"
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: '-30px' }}
          className="text-center mb-8 sm:mb-12 md:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white-900 dark:text-white mb-4">
            ABOUT ME
          </h2>
          <motion.div 
            className="w-32 sm:w-40 h-1 bg-primary mx-auto mt-4 sm:mt-6 opacity-60 shadow-glow"
            animate={{ width: ["0%", "20%", "10%", "20%"] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
          />
        </motion.header>

        <div className="flex flex-col lg:flex-row items-center gap-8 md:gap-12">
          <motion.div
            variants={fadeInLeft}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true }}
            style={{ x: textTranslateX }}
            className="w-full ms-4 lg:w-1/2 space-y-4 md:space-y-6 text-justify"
          >
            {[
              {
                delay: 0.2,
                text: `Hello! I'm a `,
                highlight: 'Web Developer & Automation Expert',
                rest: ' with hands-on experience in building production-level web applications using React.js and Next.js. I specialize in developing responsive, API-integrated frontend solutions using Tailwind CSS and Bootstrap, along with scalable automation workflows using n8n.',
              },
              {
                delay: 0.3,
                text: 'I hold a Bachelor’s degree in Information Technology and currently work on real-world projects, applying strong fundamentals in frontend development, programming concepts, and software engineering principles to solve practical business problems.',
              },
              {
                delay: 0.4,
                text: 'Alongside frontend development, I build and manage automation workflows using n8n to streamline HR, sales, and marketing processes. I enjoy leveraging modern tools and AI-driven workflows to deliver efficient, scalable, and high-quality digital solutions.',
              },
            ].map((para, index) => (
              <motion.p
                key={index}
                className="text-sm sm:text-base md:text-lg leading-relaxed text-white-700 dark:text-white-300"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: para.delay }}
                viewport={{ once: true }}
              >
                {para.text}
                {para.highlight && (
                  <span className="text-primary font-semibold"> {para.highlight}</span>
                )}
                {para.rest}
              </motion.p>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true }}
              className="pt-2 flex justify-start"
            >
              <a
                href="#contact"
                className="group inline-flex items-center px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 text-sm sm:text-base"
                aria-label="Connect with me"
              >
                Get In Touch
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </motion.div>
          </motion.div>

          {/* Profile Graphic / Skills Display */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.6, ease: 'easeOut' }}
            viewport={{ once: true }}
            className="w-full lg:w-1/2 flex justify-center lg:justify-end mt-8 lg:mt-0"
          >
            <div className="relative w-full max-w-xs sm:max-w-md aspect-square bg-gradient-to-br from-background to-muted/50 p-6 sm:p-8 rounded-xl border border-white/10 shadow-glow flex items-center justify-center">
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center">
                <img
                  src="/my.png"
                  alt="Web Developer"
                  className="w-65 h-65 sm:w-32 sm:h-32 mb-4 object-cover rounded-full border-4 border-primary"
                />
                <h3 className="text-xl sm:text-2xl font-semibold text-white-800 dark:text-white">
                  Web Developer & Automation Expert
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm sm:text-base">
                  React | Next.js | n8n | Tailwind
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.article>
    </section>
  );
};

export default AboutSection;
