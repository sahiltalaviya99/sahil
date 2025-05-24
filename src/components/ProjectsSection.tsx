import { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Github, ExternalLink, X, ArrowUp } from 'lucide-react';

type Project = {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  github: string;
  demo: string;
  detailedDescription?: string;
  featured?: boolean;
};

const projects: Project[] = [
  {
    id: 1,
    title: "Portfolio Website",
    description: "A fully responsive personal portfolio to highlight skills, experience, and projects.",
    detailedDescription: "Designed and developed a fully responsive personal portfolio to highlight skills, experience, and projects, featuring smooth transitions and a modern user interface with React and Tailwind CSS.",
    image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?ixlib=rb-1.2.1&auto=format&fit=crop&w=1170&q=80",
    tags: ["React", "Tailwind CSS", "Framer Motion"],
    github: "https://github.com/sahiltalaviya99/portfolio",
    demo: "https://sahiltalaviya.netlify.app",
    featured: true,
  },
  {
    id: 2,
    title: "ForkFleet - Food Delivery App",
    description: "A user-friendly web application for browsing restaurant menus and placing food orders.",
    detailedDescription: "Built a user-friendly web application for browsing restaurant menus and placing food orders, ensuring responsiveness and performance across devices using React, Vite, and Tailwind CSS.",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-1.2.1&auto=format&fit=crop&w=1229&q=80",
    tags: ["React", "Vite", "Tailwind CSS"],
    github: "https://github.com/sahiltalaviya99/forkfleet",
    demo: "https://forkfleet.netlify.app",
    featured: false,
  },
  {
    id: 3,
    title: "Tic Tac Toe Game",
    description: "A classic Tic Tac Toe game implemented with HTML, CSS, and JavaScript.",
    detailedDescription: "Developed an interactive Tic Tac Toe game with a clean, modern interface using HTML, CSS, and JavaScript. Features include player vs player gameplay, score tracking, game reset functionality, and responsive design.",
    image: "https://images.unsplash.com/photo-1611996575749-79a3a250f948?ixlib=rb-1.2.1&auto=format&fit=crop&w=1170&q=80",
    tags: ["HTML", "CSS", "JavaScript"],
    github: "https://github.com/sahiltalaviya99/tictactoe",
    demo: "https://sahil-tictactoe.netlify.app",
    featured: false,
  },
  {
    id: 4,
    title: "vDoctor - QA Testing",
    description: "Conducted comprehensive manual testing of the vDoctor telemedicine platform.",
    detailedDescription: "Conducted comprehensive manual testing of the vDoctor telemedicine platform on both web and mobile versions. Identified UI inconsistencies, bugs, and usability issues across user workflows and documented findings to support product improvement.",
    image: "https://images.unsplash.com/photo-1594904351111-a072f80b1a71?ixlib=rb-1.2.1&auto=format&fit=crop&w=1170&q=80",
    tags: ["Manual Testing", "QA", "UI Testing", "Documentation"],
    github: "https://github.com/sahiltalaviya99/qa-testing-samples",
    demo: "https://vdoctor.com",
    featured: false,
  },
];

const useMobileDetect = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

const ProjectCard = memo(({ project, index, onClick }: { 
  project: Project; 
  index: number; 
  onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetect();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isMobile) return;
    const card = cardRef.current;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 15;
    const rotateY = (centerX - x) / 15;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)`;
  };

  const handleMouseLeave = () => {
    if (!cardRef.current) return;
    cardRef.current.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    setHovered(false);
  };

  const handleTouch = () => {
    if (isMobile) setHovered(!hovered);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
      viewport={{ once: true, margin: "-50px" }}
      className="relative w-full h-full cursor-pointer"
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      onClick={() => {
        handleTouch();
        onClick();
      }}
      whileHover={!isMobile ? { scale: 1.03 } : {}}
      whileTap={isMobile ? { scale: 0.97 } : {}}
      style={{ 
        transition: "box-shadow 0.3s ease",
        boxShadow: hovered ? '0 12px 30px -5px rgba(0, 0, 0, 0.15), 0 8px 12px -6px rgba(0, 0, 0, 0.1)' : '0 4px 10px -2px rgba(0, 0, 0, 0.1)',
      }}
      role="button"
      aria-label={`View details for ${project.title}`}
    >
      <div className="relative overflow-hidden rounded-xl aspect-[4/3] bg-background/50">
        <motion.div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
          style={{ 
            backgroundImage: `url(${project.image})`,
            transform: hovered ? 'scale(1.08)' : 'scale(1)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {project.featured && (
          <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full shadow-sm">
            Featured
          </div>
        )}

        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 md:p-5 text-white">
          <motion.h3 
            className="text-base sm:text-lg md:text-xl font-bold mb-1 tracking-wide line-clamp-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            {project.title}
          </motion.h3>
          
          <motion.p 
            className="text-xs sm:text-sm md:text-base text-white/80 mb-2 line-clamp-2"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {project.description}
          </motion.p>
          
          <motion.div
            className="flex flex-wrap gap-1 sm:gap-1.5"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {project.tags.slice(0, isMobile ? 2 : 3).map((tag) => (
              <span 
                key={tag} 
                className="bg-primary/40 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full backdrop-blur-sm"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > (isMobile ? 2 : 3) && (
              <span className="bg-primary/40 text-white text-xs px-1.5 sm:px-2 py-0.5 rounded-full backdrop-blur-sm">
                +{project.tags.length - (isMobile ? 2 : 3)}
              </span>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
});

ProjectCard.displayName = 'ProjectCard';

const ProjectModal = ({ project, onClose }: { project: Project; onClose: () => void }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const isMobile = useMobileDetect();
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const scrollToTop = () => {
    if (modalRef.current) modalRef.current.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-labelledby={`modal-title-${project.id}`}
      aria-describedby={`modal-description-${project.id}`}
    >
      <motion.div 
        ref={modalRef}
        className="bg-background/90 backdrop-blur-md w-full max-w-[90vw] sm:max-w-2xl lg:max-w-4xl max-h-[90vh] rounded-xl relative shadow-2xl border border-white/10 overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
      >
        <button 
          className="absolute top-3 right-3 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
          onClick={onClose}
          aria-label="Close project modal"
        >
          <X size={18} className="text-white" />
        </button>
        
        <div className="relative w-full h-40 sm:h-48 md:h-56 lg:h-64 overflow-hidden">
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
              <motion.div
                className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}
          <img 
            src={project.image} 
            alt={project.title}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/50 to-transparent" />
        </div>
        
        <div className="p-4 sm:p-6 lg:p-8">
          <h3 id={`modal-title-${project.id}`} className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-3 text-foreground">
            {project.title}
          </h3>
          
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4 lg:mb-6">
            {project.tags.map((tag) => (
              <motion.span 
                key={tag} 
                className="bg-primary/20 text-primary text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                {tag}
              </motion.span>
            ))}
          </div>
          
          <p id={`modal-description-${project.id}`} className="text-xs sm:text-sm md:text-base lg:text-lg mb-4 sm:mb-6 leading-relaxed text-foreground/80">
            {project.detailedDescription || project.description}
          </p>
          
          {/* <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4">
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 sm:gap-2 bg-primary text-white text-xs sm:text-sm md:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-primary/90 transition-all"
              aria-label={`View ${project.title} source code on GitHub`}
            >
              <Github size={16} className="hover:rotate-12 transition-transform" />
              <span>View Source</span>
            </a>
            
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 sm:gap-2 bg-background/50 text-foreground text-xs sm:text-sm md:text-base px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-white/20 hover:border-white/30 hover:bg-background/70 transition-all"
              aria-label={`View live demo of ${project.title}`}
            >
              <ExternalLink size={16} />
              <span>Live Demo</span>
            </a>
          </div> */}
        </div>

        {/* <motion.button
          className="absolute bottom-3 right-3 bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"
          onClick={scrollToTop}
          aria-label="Scroll to top of modal"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowUp size={18} className="text-white" />
        </motion.button> */}
      </motion.div>
    </motion.div>
  );
};

const ProjectsSection = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [80, 0, 0, 80]);

  return (
    <section 
      id="projects" 
      ref={sectionRef} 
      className="py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-secondary/10 to-background -z-10" />
      
      <motion.div
        className="container mx-auto max-w-7xl"
        style={{ opacity, y }}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-8 sm:mb-12 md:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">My Projects </h2>
          <motion.div 
            className="w-32 sm:w-40 h-1 bg-primary mx-auto mt-4 sm:mt-6 opacity-60 shadow-glow"
            animate={{ width: ["0%", "40%", "20%", "40%"] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
          />
          
          <p className="text-foreground/70 max-w-md sm:max-w-lg md:max-w-xl mx-auto mt-3 sm:mt-4 md:mt-6 text-xs sm:text-sm md:text-base lg:text-lg px-2 sm:px-4">
            Explore my recent projects showcasing a blend of creativity, technology, and problem-solving.
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {projects.map((project, index) => (
            <ProjectCard 
              key={project.id} 
              project={project} 
              index={index}
              onClick={() => setSelectedProject(project)}
            />
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mt-8 sm:mt-12 md:mt-16"
        >
          <a 
            href="https://github.com/sahiltalaviya99"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-background/50 text-foreground text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-3 rounded-lg border border-white/20 hover:border-white/30 hover:bg-background/70 transition-all hover:shadow-lg"
            aria-label="Visit my GitHub profile for more projects"
          >
            <Github size={16} className="group-hover:rotate-12 transition-transform" />
            <span>Explore More on GitHub</span>
          </a>
        </motion.div>
      </motion.div>
      
      <AnimatePresence>
        {selectedProject && (
          <ProjectModal 
            project={selectedProject} 
            onClose={() => setSelectedProject(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default ProjectsSection;