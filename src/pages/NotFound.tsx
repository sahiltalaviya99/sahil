import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

import { site } from '@/content/site';
import { easeOutExpo } from '@/lib/motion';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error('404: no route for', location.pathname);
  }, [location.pathname]);

  // Backdrop, navbar and footer come from SiteChrome.
  return (
    <main className="grid min-h-[100svh] place-items-center px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: easeOutExpo }}
          className="w-full max-w-lg text-center"
        >
          <p className="eyebrow">Error 404</p>

          <h1 className="mt-5 font-display text-[clamp(4rem,20vw,9rem)] font-bold leading-none tracking-tighter text-gradient">
            404
          </h1>

          <p className="mt-5 text-lg text-muted-foreground">
            That page doesn’t exist. It may have moved, or the link may be wrong.
          </p>

          <p className="mt-2 break-all font-mono text-xs text-muted-foreground/60">
            {location.pathname}
          </p>

          {/* react-router Link, not a raw anchor — no full page reload. */}
          <Link to="/" className="btn-primary mt-9">
            <ArrowLeft className="h-4 w-4" />
            Back to {site.shortName}’s portfolio
          </Link>
      </motion.div>
    </main>
  );
};

export default NotFound;
