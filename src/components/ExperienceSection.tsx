import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, GraduationCap, Calendar, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const experiences = [
  {
  title: "Web Developer & Automation Expert",
  company: "iTechNotion Pvt Ltd",
  period: "2025–Present",
  description:
    "Developing and maintaining live, production-level web applications using React.js and Next.js, integrating APIs, and building automation workflows with n8n to streamline HR, sales, and marketing processes.",
  skills: [
    "React.js",
    "Next.js",
    "JavaScript",
    "Tailwind CSS",
    "Automation (n8n)",
    "Git",
    "GitHub"
  ],
  icon: "work",
  highlight: true,
},
  {
    title: "AI/ML Intern (15-day Bootcamp)",
    company: "IBM SkillBuild",
    period: "May 2024",
    description:
      "Completed a 15-day intensive internship focused on AI and machine learning. Created a chatbot using IBM Watson AI and gained hands-on experience with AI tools and technologies.",
    skills: ["IBM Watson AI", "Chatbot Development", "Machine Learning", "Python"],
    icon: "education",
    highlight: false,
  },
  {
    title: "B.Tech in Information Technology",
    company: "GIT",
    period: "2021–2025",
    description:
      "Bachelor’s degree in Information Technology, with a focus on web technologies and software development.",
    skills: ["Algorithms", "Data Structures", "OOP", "Database Systems"],
    icon: "education",
    highlight: false,
  },
];

export default function ExperienceSection() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredExperiences =
    activeTab === "all"
      ? experiences
      : experiences.filter((exp) => exp.icon === activeTab);

  return (
    <section
      id="experience"
      className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gradient-to-b from-secondary/20 to-secondary/40 min-h-[80vh] lg:min-h-[calc(100vh-4rem)]"
      aria-labelledby="experience-heading"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          
          {/* <p className="text-muted-foreground text-xs sm:text-sm md:text-base mt-2 max-w-md sm:max-w-lg mx-auto">
            My professional journey and academic background shaping my expertise
          </p> */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">Experince and Education</h2>
          <motion.div 
            className="w-32 sm:w-40 h-1 bg-primary mx-auto mt-4 sm:mt-6 opacity-60 shadow-glow"
            animate={{ width: ["0%", "40%", "20%", "40%"] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
          aria-label="Filter experiences by category"
        >
          <div className="flex justify-center mb-4 sm:mb-6 md:mb-8">
            <TabsList className="grid grid-cols-3 w-full max-w-[16rem] sm:max-w-[20rem] md:max-w-[24rem] gap-1 bg-background/90 p-1 rounded-lg shadow-sm">
              {[
                { label: "All", value: "all", icon: null },
                {
                  label: "Work",
                  value: "work",
                  icon: <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />,
                },
                {
                  label: "Education",
                  value: "education",
                  icon: <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />,
                },
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={cn(
                    "flex items-center justify-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 text-xs sm:text-sm md:text-base font-medium rounded-md transition-all duration-300",
                    "data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md",
                    "data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-muted data-[state=inactive]:hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  )}
                  aria-selected={activeTab === tab.value}
                  role="tab"
                >
                  {tab.icon && <span className="hidden xs:inline-flex">{tab.icon}</span>}
                  <span className="truncate">{tab.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="focus:outline-none">
            <div className="relative">
              {/* Timeline Line - Desktop Center */}
              <div className="hidden md:block absolute left-1/2 w-1 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 rounded-full h-full -translate-x-1/2"></div>
              
              {/* Timeline Line - Mobile Left */}
              <div className="absolute left-3 sm:left-4 w-0.5 sm:w-1 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 rounded-full h-full md:hidden"></div>

              <div className="space-y-6 sm:space-y-8 md:space-y-10">
                {filteredExperiences.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" }}
                    viewport={{ once: true, margin: "-50px" }}
                  >
                    <TimelineItem {...item} isEven={index % 2 === 0} index={index} />
                  </motion.div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function TimelineItem({ title, company, period, description, skills, icon, isEven, index, highlight }) {
  const IconComponent = icon === "work" ? (
    <Briefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
  ) : (
    <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
  );

  return (
    <div
      className={cn(
        "relative flex flex-col md:flex-row",
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      )}
    >
      {/* Timeline Dot - Mobile (Left Side) */}
      <div className="absolute left-2 sm:left-3 top-4 z-10 md:hidden">
        <motion.div
          className={cn(
            "w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-300",
            highlight
              ? "bg-gradient-to-br from-primary to-accent ring-2 ring-primary/30"
              : "bg-gradient-to-br from-primary/80 to-accent/80"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {IconComponent}
          {highlight && (
            <span className="absolute -top-1 -right-1 bg-accent rounded-full p-0.5 shadow-sm">
              <Star className="h-2.5 w-2.5 text-white" />
            </span>
          )}
        </motion.div>
      </div>

      {/* Timeline Dot - Desktop (Center) */}
      <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <motion.div
          className={cn(
            "w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-300",
            highlight
              ? "bg-gradient-to-br from-primary to-accent ring-4 ring-primary/30"
              : "bg-gradient-to-br from-primary/80 to-accent/80"
          )}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {IconComponent}
          {highlight && (
            <span className="absolute -top-1 -right-1 bg-accent rounded-full p-0.5 shadow-sm">
              <Star className="h-3 w-3 text-white" />
            </span>
          )}
        </motion.div>
      </div>

      {/* Empty Column for Desktop Layout */}
      <div className="hidden md:block md:w-1/2 md:pr-6 lg:pr-8" />

      {/* Card Section - Mobile Full Width, Desktop Half Width */}
      <div className="w-full md:w-1/2 pl-10 sm:pl-12 md:pl-0 md:px-6 lg:px-8">
        <Card
          className={cn(
            "relative shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-t-4 bg-background/95 overflow-hidden",
            highlight ? "border-t-primary" : "border-t-primary/70"
          )}
        >
          {/* {highlight && (
            <div className="absolute top-0 right-0">
              <div className="w-16 h-16 overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 rotate-45 bg-primary text-white text-xs px-5 py-1 font-medium shadow-sm">
                  Current
                </div>
              </div>
            </div>
          )} */}
          <CardHeader className="pb-2 pt-3 px-3 sm:pt-4 sm:px-4 md:pt-5 md:px-5">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3">
              <div>
                <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-semibold text-foreground">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm md:text-base text-muted-foreground">
                  {company}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground whitespace-nowrap bg-secondary/80 px-2 sm:px-2.5 py-1 rounded-full">
                <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="truncate">{period}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2 pb-4 px-3 sm:px-4 md:px-5">
            <p className="mb-3 sm:mb-4 text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed">
              {description}
            </p>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {skills.map((skill) => (
                <motion.div
                  key={skill}
                  whileHover={{ y: highlight ? -2 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs sm:text-sm bg-primary/5 hover:bg-primary/10 text-foreground border-primary/20 py-0.5 px-2 transition-colors duration-300",
                      highlight ? "hover:bg-primary/15" : ""
                    )}
                  >
                    {skill}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}