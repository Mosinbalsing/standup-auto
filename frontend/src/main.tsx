import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
// Preserve links from the original prototype while using real browser routes.
if (location.pathname === '/' && location.hash.startsWith('#/'))
  history.replaceState(null, '', location.hash.slice(1) || '/');
createRoot(document.getElementById('root')!).render(<App />);
