import { useEffect } from 'react';

import Navbar from '@/components/Navbar';
import { CommandPalette } from '@/components/CommandPalette';
import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import ExperienceSection from '@/components/ExperienceSection';
import ProjectsSection from '@/components/ProjectsSection';
import SkillsSection from '@/components/SkillsSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';
import { Backdrop } from '@/components/ui-kit/Backdrop';
import { site } from '@/content/site';

/**
 * Section order here must match SECTIONS in src/content/site.ts — that array
 * drives the navbar and the active-section observer.
 *
 * Note there is no anchor-click handler here any more. Smooth scrolling is
 * Lenis (src/App.tsx) and navigation goes through useScrollToSection.
 */
const Index = () => {
  useEffect(() => {
    document.title = `${site.name} — ${site.role}`;
  }, []);

  return (
    <>
      <Backdrop />
      <Navbar />
      {/* Mounted here rather than inside Navbar so the ⌘K listener survives
          independently of the header. */}
      <CommandPalette />

      <main>
        <HeroSection />
        <AboutSection />
        <ExperienceSection />
        <ProjectsSection />
        <SkillsSection />
        <ContactSection />
      </main>

      <Footer />
    </>
  );
};

export default Index;
