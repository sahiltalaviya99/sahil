import { createRoot } from 'react-dom/client';

// Self-hosted variable fonts — no render-blocking request to fonts.googleapis.com,
// and the site keeps its typography offline.
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Outside <App /> deliberately: it has to survive a throw from anything inside,
// including the providers.
createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
