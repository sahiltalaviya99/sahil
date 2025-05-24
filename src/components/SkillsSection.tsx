import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';

// Mapping skill levels to approximate percentage
const levelMap = {
  Expert: 90,
  Advanced: 80,
  Intermediate: 65,
};

// Skills data structured by category with icons
const skillsData = {
  frontend: [
    { name: "HTML5", level: "Expert", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg" },
    { name: "CSS3", level: "Expert", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg" },
    { name: "JavaScript (ES6+)", level: "Advanced", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" },
    { name: "React.js", level: "Advanced", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" },
    { name: "Bootstrap", level: "Advanced", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg" },
    // { name: "Tailwind CSS", level: "Intermediate", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg" },
    { name: "Material UI", level: "Intermediate", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/materialui/materialui-original.svg" }
  ],
  programming: [
    { name: "C", level: "Advanced", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg" },
    { name: "C++", level: "Advanced", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" }
  ],
  tools: [
    { name: "Git", level: "Advanced", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" },
    { name: "GitHub", level: "Advanced", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" },
    { name: "VS Code", level: "Expert", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg" },
    { name: "Figma", level: "Intermediate", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg" }
  ],
  professional: [
    { name: "Web Testing", level: "Intermediate", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/chrome/chrome-original.svg" },
    { name: "Problem Solving", level: "Advanced", icon: "https://cdn-icons-png.flaticon.com/512/1015/1015676.png" },
    { name: "Team Collaboration", level: "Advanced", icon: "https://cdn-icons-png.flaticon.com/512/2921/2921222.png" },
    // { name: "Communication", level: "Advanced", icon: "https://cdn-icons-png.flaticon.com/512/2921/2921222.png" },
  ],
  aiTools: [
    { name: "GitHub Copilot", level: "Intermediate", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg" },
    { name: "Replit Ghostwriter", level: "Advanced", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/replit/replit-original.svg" },
    { name: "CodeSandbox AI", level: "Advanced", icon: "https://codesandbox.io/static/img/play-codesandbox.svg" },
    { name: "ChatGPT", level: "Advanced", icon: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg" },
    // { name: "Cursor IDE (AI-Powered VS Code)", level: "Advanced", icon: "https://avatars.githubusercontent.com/u/122300437?s=200&v=4" },
    // { name: "StackBlitz AI", level: "Intermediate", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/stackblitz/stackblitz-original.svg" },
    // { name: "Phind (AI Search for Devs)", level: "Intermediate", icon: "https://phind.com/static/apple-touch-icon.png" },
    // { name: "Tabnine", level: "Intermediate", icon: "https://static-00.iconduck.com/assets.00/tabnine-icon-512x512-8bq8tuxv.png" },
    // { name: "Codeium", level: "Intermediate", icon: "https://avatars.githubusercontent.com/u/108250645?s=200&v=4" }
  ]
};

type Skill = {
  name: string;
  level: string;
  icon: string;
  category: keyof typeof skillsData | "all";
};

const SkillCard = ({ skill, index, selectedCategory }: { skill: Skill; index: number; selectedCategory: string }) => {
  const isVisible = selectedCategory === 'all' || skill.category === selectedCategory;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true, margin: "-50px" }}
      className={`skill-card flex flex-col items-center bg-background/60 p-4 rounded-xl shadow-md ${!isVisible ? 'hidden' : 'flex'}`}
      whileHover={{ y: -5, boxShadow: "0 10px 15px rgba(0,0,0,0.2)" }}
    >
      <div className="relative mb-6 w-20 h-20 flex items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/20"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.7, 0.9, 0.7]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <img src={skill.icon} alt={skill.name} className="w-14 h-14 z-10 object-contain" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">{skill.name}</h3>
    </motion.div>
  );
};

const SkillsSection = () => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | keyof typeof skillsData>('all');
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [100, 0, 0, 100]);

  const categories = [
    { id: 'all', name: 'All Skills' },
    { id: 'frontend', name: 'Frontend' },
    { id: 'programming', name: 'Programming' },
    { id: 'tools', name: 'Tools' },
    { id: 'professional', name: 'Professional' },
    { id: 'aiTools', name: 'AI Tools' },
  ];

  const allSkills: Skill[] = Object.entries(skillsData).flatMap(([category, skills]) =>
    skills.map(skill => ({ ...skill, category: category as keyof typeof skillsData }))
  );

  const bubbleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1,
        duration: 0.5
      }
    })
  };

  return (
    <section id="skills" ref={sectionRef} className="py-12 sm:py-16 md:py-24 px-4 relative overflow-hidden min-h-[600px]">
      <div className="absolute inset-0 -z-10">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/10"
            style={{
              width: Math.random() * 90 + 40,
              height: Math.random() * 90 + 40,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 80 - 40],
              y: [0, Math.random() * 80 - 40],
            }}
            transition={{
              duration: Math.random() * 10 + 8,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      <motion.div
        className="container mx-auto max-w-7xl"
        style={{ opacity, y }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-120px" }}
          className="text-center mb-12 px-4 sm:px-6"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">SKILLS & TECHNOLOGIES</h2>
          <motion.div
            className="w-32 sm:w-40 h-1 bg-primary mx-auto mt-4 sm:mt-6 opacity-60 shadow-glow rounded"
            animate={{ width: ["0%", "40%", "20%", "40%"] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          />
          <p className="text-foreground/70 max-w-xl mx-auto mt-4 sm:mt-6 text-sm sm:text-base md:text-lg">
            I work with a variety of technologies to create responsive and efficient web applications.
          </p>
        </motion.div>

        <div className="mb-8 sm:mb-12 flex justify-center flex-wrap gap-2 sm:gap-4 px-4 sm:px-6">
          {categories.map((category, i) => (
            <motion.button
              key={category.id}
              custom={i}
              variants={bubbleVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className={`px-3 sm:px-5 py-2 rounded-full transition-all duration-300 font-semibold text-xs sm:text-sm md:text-base ${
                selectedCategory === category.id
                  ? 'bg-primary text-white shadow-glow'
                  : 'bg-secondary/50 text-foreground/80 hover:bg-secondary'
              }`}
              onClick={() => setSelectedCategory(category.id as any)}
              aria-pressed={selectedCategory === category.id}
            >
              {category.name}
            </motion.button>
          ))}
        </div>

        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8 px-4 sm:px-6"
          layout
          transition={{ type: "spring", damping: 20 }}
        >
          {allSkills.map((skill, index) => (
            <SkillCard
              key={`${skill.name}-${skill.category}`}
              skill={skill}
              index={index}
              selectedCategory={selectedCategory}
            />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default SkillsSection;