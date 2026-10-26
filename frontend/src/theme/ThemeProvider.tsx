import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
type Theme = 'light' | 'dark';
type Appearance = Theme | 'system';
const ThemeContext = createContext({
  theme: 'light' as Theme, appearance: 'system' as Appearance, reduced: false,
  setTheme: (_theme: Appearance) => {}, setReduced: (_value: boolean) => {},
});
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [appearance, setTheme] = useState<Appearance>(() => {
    const saved = localStorage.getItem('sa-theme');
    return saved === 'dark' || saved === 'light' ? saved : 'system';
  });
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  const [reduced, setReduced] = useState(() => localStorage.getItem('sa-reduced') === 'true');
  const theme: Theme = appearance === 'system' ? (systemDark ? 'dark' : 'light') : appearance;
  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    document.body.classList.toggle('light', theme === 'light');
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem('sa-theme', appearance);
  }, [theme, appearance]);
  useEffect(() => {
    document.body.classList.toggle('no-motion', reduced);
    localStorage.setItem('sa-reduced', String(reduced));
  }, [reduced]);
  return <ThemeContext.Provider value={{ theme, appearance, setTheme, reduced, setReduced }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
