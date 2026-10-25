import { Link } from 'react-router-dom';
import { Moon, Sun, ArrowRight } from 'lucide-react';
import { Brand } from './Brand';
import { useTheme } from '@/theme/ThemeProvider';
export function PublicHeader({ login = false }: { login?: boolean }) {
  const { theme, setTheme } = useTheme();
  return (
    <header className="public-nav">
      <Brand />
      <nav className="public-links" aria-label="Main navigation">
        {!login && (
          <>
            <a href="#how-it-works" className="desktop-link">
              How it works
            </a>
            <a href="#privacy" className="desktop-link">
              Privacy
            </a>
          </>
        )}
        <button
          className="icon-btn"
          aria-label={theme === 'light' ? 'Use dark mode' : 'Use light mode'}
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        {login ? (
          <Link className="text-link" to="/">
            Back to home <ArrowRight size={15} />
          </Link>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link className="btn primary" to="/login">
              Get started <ArrowRight size={15} />
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
