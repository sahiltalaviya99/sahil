import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, Phone, FileText } from 'lucide-react';
import { useAppSelector } from '../hooks/redux';

const socialLinks = [
  {
    name: 'GitHub',
    href: 'https://github.com/sahiltalaviya99',
    icon: Github,
    ariaLabel: 'Explore my GitHub projects',
    color: 'hover:text-purple-400'
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/sahil-talaviya-99o9657o18',
    icon: Linkedin,
    ariaLabel: 'Connect with me on LinkedIn',
    color: 'hover:text-blue-400'
  },
  {
    name: 'Email',
    href: 'mailto:sahiltalaviya9922@gmail.com',
    icon: Mail,
    ariaLabel: 'Send me an email',
    color: 'hover:text-red-400'
  },
  {
    name: 'Resume',
    href: '/resume.pdf',
    icon: FileText,
    ariaLabel: 'Download my resume',
    color: 'hover:text-green-400'
  }
];

const Footer = () => {
  const { theme } = useAppSelector((state) => state.theme);
  const isDark = theme === 'dark';

  const iconVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.2,
      rotate: [0, -10, 10, 0],
      transition: {
        duration: 0.6,
        type: 'spring',
        stiffness: 300,
        damping: 10
      }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <motion.footer
      className={`relative overflow-hidden border-t ${
        isDark ? 'border-white/10' : 'border-black/10'
      } py-12 px-4 sm:px-6 lg:px-8 bg-background/95 backdrop-blur-sm`}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={containerVariants}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${
              isDark ? 'bg-primary/10' : 'bg-primary/5'
            }`}
            style={{
              width: Math.random() * 120 + 30,
              height: Math.random() * 120 + 30,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              opacity: [0.7, 0.9, 0.7],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <div className="container mx-auto max-w-7xl">
        {/* Contact section */}
        <motion.div 
          className="text-center mb-12"
          variants={itemVariants}
        >
          <motion.h2 
            className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary mb-4"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            Transforming Ideas into Scalable AI-Driven Products.
          </motion.h2>
          {/* <motion.p
            className={`max-w-2xl mx-auto text-lg ${
              isDark ? 'text-foreground/80' : 'text-foreground/70'
            }`}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
          >
            I'm currently looking for new opportunities. Whether you have a question or just want to say hi, I'll do my best to get back to you!
          </motion.p> */}
          <motion.p
  className={`max-w-2xl mx-auto text-lg ${
    isDark ? 'text-foreground/80' : 'text-foreground/70'
  }`}
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  transition={{ delay: 0.2 }}
  viewport={{ once: true }}
>
  I am currently open to new professional opportunities. Please feel free to contact me with any inquiries or collaboration proposals, and I will respond promptly.
</motion.p>

        </motion.div>

        {/* Social links */}
        <motion.div 
          className="flex justify-center gap-4 sm:gap-6 mb-12"
          variants={containerVariants}
        >
          {socialLinks.map((link) => (
            <motion.a
              key={link.name}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.ariaLabel}
              className={`p-3 rounded-full ${
                isDark ? 'bg-white/5' : 'bg-black/5'
              } ${link.color} transition-all duration-300`}
              variants={itemVariants}
              whileHover="hover"
              whileTap={{ scale: 0.9 }}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={iconVariants}>
                <link.icon className="w-6 h-6" />
              </motion.div>
            </motion.a>
          ))}
        </motion.div>

        {/* Contact info */}
        {/* <motion.div 
          className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-12"
          variants={itemVariants}
        >
          <a 
            href="mailto:sahiltalaviya9922@gmail.com" 
            className={`flex items-center gap-2 ${
              isDark ? 'text-foreground/80 hover:text-primary' : 'text-foreground/70 hover:text-secondary'
            } transition-colors`}
          >
            <Mail className="w-5 h-5" />
            <span>sahiltalaviya9922@gmail.com</span>
          </a>
          <a 
            href="tel:+919999999999" 
            className={`flex items-center gap-2 ${
              isDark ? 'text-foreground/80 hover:text-primary' : 'text-foreground/70 hover:text-secondary'
            } transition-colors`}
          >
            <Phone className="w-5 h-5" />
            <span>+91 9909657018</span>
          </a>
        </motion.div> */}

        {/* Copyright */}
        <motion.div 
          className={`pt-6 border-t ${
            isDark ? 'border-white/10' : 'border-black/10'
          } text-center`}
          variants={itemVariants}
        >
          <p className={`text-sm ${
            isDark ? 'text-foreground/70' : 'text-foreground/60'
          }`}>
            © {new Date().getFullYear()} Sahil Talaviya. All rights reserved.
          </p>
          <p className={`text-xs mt-2 ${
            isDark ? 'text-foreground/50' : 'text-foreground/40'
          }`}>
            Built with React, TypeScript, and Tailwind CSS
          </p>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;