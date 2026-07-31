import { createRoot } from 'react-dom/client';

// Self-hosted variable fonts — no render-blocking request to fonts.googleapis.com,
// and the site keeps its typography offline.
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/inter';
import '@fontsource-variable/jetbrains-mono';

import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
