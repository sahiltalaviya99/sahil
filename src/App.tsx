import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ReactLenis, type LenisRef } from 'lenis/react';
import { cancelFrame, frame } from 'framer-motion';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import Index from './pages/Index';
import NotFound from './pages/NotFound';

/**
 * Lenis drives all scrolling on the site.
 *
 * `autoRaf: false` plus framer's own `frame` loop is deliberate — running
 * Lenis on its own requestAnimationFrame alongside framer-motion means two
 * tickers fighting over the same frame, which shows up as jitter on
 * scroll-linked animation.
 */
const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const lenisRef = useRef<LenisRef>(null);

  useEffect(() => {
    const update = (data: { timestamp: number }) => {
      lenisRef.current?.lenis?.raf(data.timestamp);
    };

    frame.update(update, true);
    return () => cancelFrame(update);
  }, []);

  return (
    <ReactLenis
      root
      ref={lenisRef}
      options={{
        autoRaf: false,
        lerp: 0.09,
        wheelMultiplier: 1,
        // Native scrolling on touch — hijacking it there feels broken.
        syncTouch: false,
      }}
    >
      {children}
    </ReactLenis>
  );
};

const App = () => (
  <TooltipProvider delayDuration={200}>
    <SmoothScroll>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SmoothScroll>
    <Toaster />
  </TooltipProvider>
);

export default App;
