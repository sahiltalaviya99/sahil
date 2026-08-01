import { useEffect } from 'react';

import HeroSection from '@/components/HeroSection';
import AboutSection from '@/components/AboutSection';
import ExperienceSection from '@/components/ExperienceSection';
import ProjectsSection from '@/components/ProjectsSection';
import SkillsSection from '@/components/SkillsSection';
import ContactSection from '@/components/ContactSection';
import { LabTeaser } from '@/components/LabTeaser';
import { site } from '@/content/site';
import { useHashLanding } from '@/hooks/use-section-nav';

/**
 * Section order here must match SECTIONS in src/content/site.ts — that array
 * drives the navbar and the active-section observer.
 *
 * Note there is no anchor-click handler here any more. Smooth scrolling is
 * Lenis (src/App.tsx) and navigation goes through useScrollToSection.
 */
const Index = () => {
  // Consumes the /#section hash left behind when something on /lab (navbar,
  // footer sitemap, terminal `open`) jumps back to a section on this page.
  useHashLanding();

  useEffect(() => {
    document.title = `${site.name} — ${site.role}`;
  }, []);

  // The navbar, footer, backdrop, cursor and ⌘K palette are in SiteChrome — a
  // layout route — so they survive navigation to /lab and /motion instead of
  // being torn down and rebuilt, which read as a full page reload.
  return (
    <main>
      <HeroSection />
      <AboutSection />
      <ExperienceSection />
      <ProjectsSection />
      <SkillsSection />
      {/* The interactive work lives at /lab now — this is the doorway to it. */}
      <LabTeaser />
      <ContactSection />
    </main>
  );
};

export default Index;
