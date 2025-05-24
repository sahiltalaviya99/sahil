import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Menu, X, Download, ChevronRight, Home, User, Briefcase, FolderOpen, Zap, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [lastScrollY, setLastScrollY] = useState(0);
  const menuRef = useRef(null);

  // Motion values for enhanced animations
  const menuProgress = useMotionValue(0);
  const menuScale = useTransform(menuProgress, [0, 1], [0.95, 1]);
  const menuOpacity = useTransform(menuProgress, [0, 1], [0, 1]);

  // Scroll handler
  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    setScrolled(currentScrollY > 10);
    setLastScrollY(currentScrollY);
    
    // Section detection
    const sections = ['home', 'about', 'experience', 'projects', 'skills', 'contact'];
    const currentSection = sections.find(section => {
      const element = document.getElementById(section);
      if (element) {
        const rect = element.getBoundingClientRect();
        return rect.top <= 150 && rect.bottom >= 150;
      }
      return false;
    });
    
    if (currentSection && currentSection !== activeSection) {
      setActiveSection(currentSection);
    }
  }, [lastScrollY, activeSection]);

  // Scroll event listener
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  // Enhanced body scroll prevention
  useEffect(() => {
    if (mobileMenuOpen) {
      const scrollY = window.scrollY;
      const body = document.body;
      
      body.style.cssText = `
        overflow: hidden;
        position: fixed;
        top: -${scrollY}px;
        left: 0;
        right: 0;
        width: 100%;
        height: 100vh;
      `;
      
      menuProgress.set(1);
      
      return () => {
        body.style.cssText = '';
        window.scrollTo({ top: scrollY, behavior: 'instant' });
        menuProgress.set(0);
      };
    }
  }, [mobileMenuOpen, menuProgress]);

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!mobileMenuOpen) return;
      
      switch (e.key) {
        case 'Escape':
          setMobileMenuOpen(false);
          break;
        case 'Tab':
          // Trap focus within mobile menu
          const focusableElements = menuRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusableElements?.length) {
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];
            
            if (e.shiftKey && document.activeElement === firstElement) {
              e.preventDefault();
              lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              e.preventDefault();
              firstElement.focus();
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', href: '#home', icon: Home },
    { name: 'About', href: '#about', icon: User },
    { name: 'Experience', href: '#experience', icon: Briefcase },
    { name: 'Projects', href: '#projects', icon: FolderOpen },
    { name: 'Skills', href: '#skills', icon: Zap },
    { name: 'Contact', href: '#contact', icon: Mail },
  ];

  const handleNavClick = useCallback((href) => {
    setMobileMenuOpen(false);
    
    setTimeout(() => {
      const element = document.querySelector(href);
      if (element) {
        const offsetTop = element.offsetTop - 80; // Account for fixed header
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    }, 150);
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev);
  }, []);

  return (
    <>
      {/* Navbar */}
      <motion.header 
        className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 ${
          scrolled 
            ? 'glass-effect py-2 sm:py-3 border-b border-white/10 shadow-lg backdrop-blur-xl' 
            : 'bg-transparent py-3 sm:py-4'
        }`}
        animate={{
          y: 0, // Always visible
          opacity: 1
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <motion.a 
            href="#home" 
            className="text-xl sm:text-2xl font-bold gradient-text z-50 relative select-none no-underline"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.5 }}
            onClick={() => setMobileMenuOpen(false)}
            style={{ textDecoration: 'none' }}
          >
            SAHIL
          </motion.a>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">
            <ul className="flex gap-4 lg:gap-6">
              {navLinks.map((link, index) => (
                <motion.li 
                  key={link.name}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <a 
                    href={link.href} 
                    className={`nav-link text-sm lg:text-base font-medium transition-all duration-300 px-3 py-2 rounded-lg relative no-underline ${
                      activeSection === link.href.substring(1) 
                        ? 'text-primary bg-primary/10 shadow-sm' 
                        : 'hover:text-primary hover:bg-primary/5'
                    }`}
                    aria-current={activeSection === link.href.substring(1) ? 'page' : undefined}
                    style={{ textDecoration: 'none' }}
                  >
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="ml-4"
            >
              <Button
                variant="outline"
                size="sm"
                asChild
                className="px-4 py-2 rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <a
                  href="/resume.pdf"
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Resume
                </a>
              </Button>
            </motion.div>
          </nav>
          
          {/* Mobile Controls */}
          <div className="flex items-center md:hidden gap-2 z-50 relative">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMobileMenu}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className="rounded-full w-9 h-9 hover:bg-primary/10 hover:scale-110 transition-all duration-300 relative"
            >
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <X className="h-5 w-5" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <Menu className="h-5 w-5" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {/* Ripple effect */}
              {mobileMenuOpen && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/20"
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
              )}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Enhanced Backdrop */}
            <motion.div
              className="fixed inset-0 bg-gradient-to-br from-black/30 via-black/20 to-black/30 backdrop-blur-md z-40 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.aside 
              ref={menuRef}
              className="fixed mt-10 top-7 right-0 h-full w-full max-w-sm bg-background/98 backdrop-blur-2xl border-l border-border/50 z-40 md:hidden shadow-2xl overflow-hidden"
              style={{ scale: menuScale, opacity: menuOpacity }}
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ 
                type: "spring", 
                damping: 28, 
                stiffness: 220,
                mass: 0.9,
                opacity: { duration: 0.2 }
              }}
            >
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Navigation Links */}
              <nav className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-2">
                  {navLinks.map((link, index) => {
                    const Icon = link.icon;
                    const isActive = activeSection === link.href.substring(1);
                    
                    return (
                      <motion.button
                        key={link.name}
                        onClick={() => handleNavClick(link.href)}
                        className={`group relative w-full text-left text-base font-medium transition-all duration-300 px-4 py-4 rounded-xl border border-transparent flex items-center gap-4 ${
                          isActive
                            ? 'bg-primary/10 text-primary border-primary/20 shadow-lg scale-[1.02]'
                            : 'hover:bg-primary/5 hover:text-primary hover:border-primary/10 hover:scale-[1.01]'
                        }`}
                        initial={{ opacity: 0, x: 30, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        transition={{ 
                          delay: index * 0.08 + 0.15,
                          type: "spring",
                          stiffness: 300,
                          damping: 25
                        }}
                        whileHover={{ x: 8 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-primary'} transition-colors duration-300`} />
                        <span className="flex-1">{link.name}</span>
                        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${isActive ? 'text-primary opacity-100' : 'opacity-0 group-hover:opacity-60'}`} />
                      </motion.button>
                    );
                  })}
                </div>
              </nav>

              {/* Action Section */}
              <footer className="p-6 border-t border-border/30 bg-background/50 backdrop-blur-sm space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-center py-4 text-sm font-medium rounded-xl hover:bg-primary hover:text-primary-foreground transition-all duration-300 hover:scale-105 active:scale-95"
                    asChild
                  >
                    <a
                      href="/resume.pdf"
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ textDecoration: 'none' }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Resume
                    </a>
                  </Button>
                </motion.div>
              </footer>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;